import fs from 'node:fs'
import type { ServerResponse } from 'node:http'
import path from 'node:path'
import type { Plugin } from 'vite'

const MONTHS: Record<string, number> = {
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

function parseDateSlug(slug: string): number {
  const match = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(slug)
  if (!match) return 0
  const day = Number(match[1])
  const month = MONTHS[match[2]]
  const year = Number(match[3])
  if (month === undefined || Number.isNaN(day) || Number.isNaN(year)) return 0
  return Date.UTC(year, month, day)
}

function isDateSlug(name: string): boolean {
  return /^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(name)
}

type DateEntry = {
  date_slug: string
  date: string | null
  has_local_top5: boolean
  has_coastal_katte: boolean
}

function localTop5Path(workRoot: string, slug: string): string {
  return path.join(workRoot, slug, 'Daily_top', `LocalTop5_${slug}.json`)
}

function coastalKattePath(workRoot: string, slug: string): string {
  return path.join(workRoot, slug, 'Coastal_Katte', `CoastalKatte_Top5_${slug}.json`)
}

function readJsonLabel(filePath: string): string | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(raw) as { date?: string }
    return typeof data.date === 'string' ? data.date : null
  } catch {
    return null
  }
}

function listDates(workRoot: string): DateEntry[] {
  if (!fs.existsSync(workRoot)) return []

  const entries: DateEntry[] = []
  for (const name of fs.readdirSync(workRoot)) {
    const full = path.join(workRoot, name)
    if (!fs.statSync(full).isDirectory() || !isDateSlug(name)) continue

    const localPath = localTop5Path(workRoot, name)
    const ckPath = coastalKattePath(workRoot, name)
    const has_local_top5 = fs.existsSync(localPath)
    const has_coastal_katte = fs.existsSync(ckPath)
    if (!has_local_top5 && !has_coastal_katte) continue

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

  entries.sort((a, b) => parseDateSlug(b.date_slug) - parseDateSlug(a.date_slug))
  return entries
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function sendFileJson(res: ServerResponse, filePath: string) {
  if (!fs.existsSync(filePath)) {
    sendJson(res, 404, { error: 'Not found', path: filePath })
    return
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    JSON.parse(raw)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(raw)
  } catch (err) {
    sendJson(res, 500, {
      error: 'Failed to read JSON',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}

export function workApiPlugin(workRoot: string): Plugin {
  const resolvedRoot = path.resolve(workRoot)

  return {
    name: 'work-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/api/')) {
          next()
          return
        }

        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }

        if (url === '/api/dates') {
          sendJson(res, 200, listDates(resolvedRoot))
          return
        }

        const localMatch = /^\/api\/local-top5\/([^/]+)\/?$/.exec(url)
        if (localMatch) {
          const slug = decodeURIComponent(localMatch[1])
          if (!isDateSlug(slug)) {
            sendJson(res, 400, { error: 'Invalid date slug' })
            return
          }
          sendFileJson(res, localTop5Path(resolvedRoot, slug))
          return
        }

        const ckMatch = /^\/api\/coastal-katte\/([^/]+)\/?$/.exec(url)
        if (ckMatch) {
          const slug = decodeURIComponent(ckMatch[1])
          if (!isDateSlug(slug)) {
            sendJson(res, 400, { error: 'Invalid date slug' })
            return
          }
          sendFileJson(res, coastalKattePath(resolvedRoot, slug))
          return
        }

        sendJson(res, 404, { error: 'Unknown API route' })
      })
    },
  }
}
