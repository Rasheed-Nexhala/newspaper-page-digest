#!/usr/bin/env node
/**
 * Upserts Full Paper JSON from ../work into Firestore (editions + articles).
 * Idempotent. Auth, in order:
 *   FIREBASE_SERVICE_ACCOUNT=<json>
 *   GOOGLE_APPLICATION_CREDENTIALS (ADC)
 *   gcloud auth print-access-token
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GoogleAuth, JWT } from 'google-auth-library'
import { makeSavedArticleId } from './article-id.mjs'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const viewerRoot = path.resolve(rootDir, '..')
const workRoot = path.resolve(viewerRoot, '../work')
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'newspaper-page-digest'
const BATCH_LIMIT = 400
const SCOPES = [
  'https://www.googleapis.com/auth/datastore',
  'https://www.googleapis.com/auth/cloud-platform',
]

function isDateSlug(name) {
  return /^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(name)
}

function fullPaperPath(slug) {
  return path.join(workRoot, slug, 'Full_paper', `FullPaper_${slug}.json`)
}

function omitUndefined(value) {
  if (Array.isArray(value)) return value.map(omitUndefined)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, nested] of Object.entries(value)) {
      if (nested === undefined) continue
      out[key] = omitUndefined(nested)
    }
    return out
  }
  return value
}

function encodeValue(value) {
  if (value === null) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value }
  }
  if (typeof value === 'string') return { stringValue: value }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } }
  }
  if (typeof value === 'object') {
    const fields = {}
    for (const [key, nested] of Object.entries(value)) {
      if (nested === undefined) continue
      fields[key] = encodeValue(nested)
    }
    return { mapValue: { fields } }
  }
  throw new Error(`Unsupported value type: ${typeof value}`)
}

function toFields(data) {
  const fields = {}
  for (const [key, nested] of Object.entries(omitUndefined(data))) {
    fields[key] = encodeValue(nested)
  }
  return fields
}

function docName(collection, id) {
  return `projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${id}`
}

function baseRecord(fp, item, extra) {
  const id = makeSavedArticleId({
    date_slug: fp.date_slug,
    sources: item.sources ?? [],
    headline: item.headline,
    scope: item.scope,
    kind: item.kind,
  })
  return omitUndefined({
    id,
    date_slug: fp.date_slug,
    date: fp.date,
    headline: item.headline,
    gist: item.gist,
    kind: item.kind,
    scope: item.scope,
    sources: item.sources ?? [],
    rank: item.rank,
    paragraph: item.paragraph,
    what_this_is: item.what_this_is,
    important_points: item.important_points,
    points: item.points,
    ...extra,
  })
}

function flattenFullPaper(fp) {
  const records = []
  const newsBuckets = fp.sections?.news?.buckets ?? {}
  for (const [bucket, group] of Object.entries(newsBuckets)) {
    const items = group?.items ?? []
    items.forEach((item, sort_index) => {
      records.push(
        baseRecord(fp, item, {
          origin: 'full_paper_news',
          bucket,
          sort_index,
        }),
      )
    })
  }

  const tech = fp.sections?.technology ?? {}
  ;(tech.top5?.items ?? []).forEach((item, sort_index) => {
    records.push(
      baseRecord(fp, item, {
        origin: 'full_paper_technology',
        technology_group: 'top5',
        sort_index,
      }),
    )
  })
  ;(tech.rest?.items ?? []).forEach((item, sort_index) => {
    records.push(
      baseRecord(fp, item, {
        origin: 'full_paper_technology',
        technology_group: 'rest',
        sort_index,
      }),
    )
  })

  ;(fp.sections?.opinion?.items ?? []).forEach((item, sort_index) => {
    records.push(
      baseRecord(fp, item, {
        origin: 'full_paper_opinion',
        sort_index,
      }),
    )
  })

  return records
}

function editionFromFullPaper(fp) {
  const sections = fp.sections
  return omitUndefined({
    date: fp.date,
    date_slug: fp.date_slug,
    papers_scanned: fp.papers_scanned ?? [],
    summary: fp.summary,
    section_labels: {
      news: sections.news?.label ?? 'Complete news',
      technology: sections.technology?.label ?? 'Technology',
      technology_top5: sections.technology?.top5?.label ?? 'Technology Top 5',
      technology_rest: sections.technology?.rest?.label ?? 'More technology',
      opinion: sections.opinion?.label ?? 'Opinion & Explainers',
    },
    has_full_paper: true,
  })
}

const FIREBASE_TOOLS_OAUTH = {
  client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
  client_secret: 'jEQPZ7cvhALrw2M0SGoJXbMA',
}

async function tokenFromFirebaseTools() {
  const cfgPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json')
  if (!fs.existsSync(cfgPath)) return null
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  const tokens = cfg.tokens
  if (!tokens) return null
  if (tokens.access_token && tokens.expires_at && Date.now() < tokens.expires_at - 60_000) {
    return tokens.access_token
  }
  if (!tokens.refresh_token) return tokens.access_token || null
  const body = new URLSearchParams({
    client_id: FIREBASE_TOOLS_OAUTH.client_id,
    client_secret: FIREBASE_TOOLS_OAUTH.client_secret,
    refresh_token: tokens.refresh_token,
    grant_type: 'refresh_token',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) return tokens.access_token || null
  const json = await res.json()
  return json.access_token || null
}

async function getAccessToken() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (raw) {
    const parsed = JSON.parse(raw)
    const jwt = new JWT({
      email: parsed.client_email,
      key: parsed.private_key,
      scopes: SCOPES,
    })
    const token = await jwt.getAccessToken()
    return token.token || token
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const auth = new GoogleAuth({ scopes: SCOPES })
    const client = await auth.getClient()
    const token = await client.getAccessToken()
    return token.token || token
  }
  const fromCli = await tokenFromFirebaseTools()
  if (fromCli) return fromCli
  const token = execSync('gcloud auth print-access-token', {
    encoding: 'utf8',
  }).trim()
  if (!token) {
    throw new Error(
      'No credentials. Set FIREBASE_SERVICE_ACCOUNT, GOOGLE_APPLICATION_CREDENTIALS, or firebase/gcloud login.',
    )
  }
  return token
}

async function firestoreCommit(token, writes) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ writes }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Firestore commit ${res.status}: ${body}`)
  }
}

async function listArticleIdsForDate(token, dateSlug) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'articles' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'date_slug' },
            op: 'EQUAL',
            value: { stringValue: dateSlug },
          },
        },
      },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Firestore query ${res.status}: ${body}`)
  }
  const rows = await res.json()
  const ids = []
  for (const row of rows) {
    const name = row.document?.name
    if (!name) continue
    ids.push(name.split('/').pop())
  }
  return ids
}

async function commitInChunks(token, writes) {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    await firestoreCommit(token, writes.slice(i, i + BATCH_LIMIT))
  }
}

async function syncFile(token, filePath) {
  const fp = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (!fp.date_slug) {
    throw new Error(`Missing date_slug in ${filePath}`)
  }
  const records = flattenFullPaper(fp)
  const edition = editionFromFullPaper(fp)
  const existingIds = await listArticleIdsForDate(token, fp.date_slug)
  const nextIds = new Set(records.map((r) => r.id))
  const stale = existingIds.filter((id) => !nextIds.has(id))

  const deleteWrites = stale.map((id) => ({ delete: docName('articles', id) }))
  const upsertWrites = [
    {
      update: {
        name: docName('editions', fp.date_slug),
        fields: toFields(edition),
      },
    },
    ...records.map((record) => ({
      update: {
        name: docName('articles', record.id),
        fields: toFields(record),
      },
    })),
  ]

  await commitInChunks(token, deleteWrites)
  await commitInChunks(token, upsertWrites)
  return { slug: fp.date_slug, articles: records.length, removed: stale.length }
}

async function main() {
  if (!fs.existsSync(workRoot)) {
    console.log('No work/ folder; nothing to sync.')
    return
  }

  const onlySlug = process.argv[2]
  const slugs = fs
    .readdirSync(workRoot)
    .filter((name) => {
      const full = path.join(workRoot, name)
      return fs.statSync(full).isDirectory() && isDateSlug(name)
    })
    .filter((name) => (onlySlug ? name === onlySlug : true))
    .filter((name) => fs.existsSync(fullPaperPath(name)))

  if (slugs.length === 0) {
    console.log('No FullPaper JSON found to sync.')
    return
  }

  const token = await getAccessToken()
  for (const slug of slugs) {
    const result = await syncFile(token, fullPaperPath(slug))
    console.log(
      `Synced ${result.slug}: ${result.articles} articles` +
        (result.removed ? `, removed ${result.removed} stale` : ''),
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
