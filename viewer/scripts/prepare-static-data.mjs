#!/usr/bin/env node
/**
 * Copies Local Top 5 + Coastal Katte JSON from ../work into public/data/
 * and writes dates.json so the production build works on GitHub Pages
 * (no Vite /api middleware).
 *
 * Layout:
 *   public/data/dates.json
 *   public/data/<DD-Mon-YYYY>/local-top5.json
 *   public/data/<DD-Mon-YYYY>/coastal-katte.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const viewerRoot = path.resolve(rootDir, '..')
const workRoot = path.resolve(viewerRoot, '../work')
const outRoot = path.resolve(viewerRoot, 'public/data')

const MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
}

function parseDateSlug(slug) {
  const match = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(slug)
  if (!match) return 0
  const day = Number(match[1])
  const month = MONTHS[match[2]]
  const year = Number(match[3])
  if (month === undefined || Number.isNaN(day) || Number.isNaN(year)) return 0
  return Date.UTC(year, month, day)
}

function isDateSlug(name) {
  return /^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(name)
}

function localTop5Path(slug) {
  return path.join(workRoot, slug, 'Daily_top', `LocalTop5_${slug}.json`)
}

function coastalKattePath(slug) {
  return path.join(workRoot, slug, 'Coastal_Katte', `CoastalKatte_Top5_${slug}.json`)
}

function readJsonLabel(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return typeof data.date === 'string' ? data.date : null
  } catch {
    return null
  }
}

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function copyJson(src, dest) {
  const raw = fs.readFileSync(src, 'utf8')
  JSON.parse(raw) // validate
  ensureDir(path.dirname(dest))
  fs.writeFileSync(dest, raw)
}

rmrf(outRoot)
ensureDir(outRoot)

const entries = []

if (fs.existsSync(workRoot)) {
  for (const name of fs.readdirSync(workRoot)) {
    const full = path.join(workRoot, name)
    if (!fs.statSync(full).isDirectory() || !isDateSlug(name)) continue

    const localPath = localTop5Path(name)
    const ckPath = coastalKattePath(name)
    const has_local_top5 = fs.existsSync(localPath)
    const has_coastal_katte = fs.existsSync(ckPath)
    if (!has_local_top5 && !has_coastal_katte) continue

    const dayDir = path.join(outRoot, name)
    ensureDir(dayDir)

    if (has_local_top5) {
      copyJson(localPath, path.join(dayDir, 'local-top5.json'))
    }
    if (has_coastal_katte) {
      copyJson(ckPath, path.join(dayDir, 'coastal-katte.json'))
    }

    const date =
      (has_local_top5 ? readJsonLabel(localPath) : null) ??
      (has_coastal_katte ? readJsonLabel(ckPath) : null)

    entries.push({
      date_slug: name,
      date,
      has_local_top5,
      has_coastal_katte,
    })
  }
}

entries.sort((a, b) => parseDateSlug(b.date_slug) - parseDateSlug(a.date_slug))

fs.writeFileSync(path.join(outRoot, 'dates.json'), `${JSON.stringify(entries, null, 2)}\n`)

console.log(
  `Prepared ${entries.length} edition(s) → ${path.relative(viewerRoot, outRoot)}/`,
)
for (const e of entries) {
  const bits = [
    e.has_local_top5 ? 'local' : null,
    e.has_coastal_katte ? 'coastal' : null,
  ].filter(Boolean)
  console.log(`  ${e.date_slug} (${bits.join(', ')})`)
}
