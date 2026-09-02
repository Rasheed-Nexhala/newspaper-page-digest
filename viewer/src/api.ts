import { fetchFullPaper as fetchFullPaperFromFirestore } from './lib/articles'
import type { CoastalKatteTop5, DateEntry, FullPaper, LocalTop5 } from './types'

declare const __DATA_CACHE_BUST__: string

/** Production / preview: static files under public/data. Dev: Vite /api middleware. */
const useStaticData = !import.meta.env.DEV

function staticDataUrl(relPath: string): string {
  const base = import.meta.env.BASE_URL
  const prefix = base.endsWith('/') ? base : `${base}/`
  const sep = relPath.includes('?') ? '&' : '?'
  const bust =
    typeof __DATA_CACHE_BUST__ !== 'undefined' && __DATA_CACHE_BUST__
      ? `${sep}v=${encodeURIComponent(__DATA_CACHE_BUST__)}`
      : ''
  return `${prefix}data/${relPath}${bust}`
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) detail = body.error
    } catch {
      // ignore parse errors
    }
    throw new Error(`${url}: ${detail}`)
  }
  return res.json() as Promise<T>
}

export function fetchDates(): Promise<DateEntry[]> {
  if (useStaticData) {
    return fetchJson<DateEntry[]>(staticDataUrl('dates.json'))
  }
  return fetchJson<DateEntry[]>('/api/dates')
}

export function fetchLocalTop5(dateSlug: string): Promise<LocalTop5> {
  if (useStaticData) {
    return fetchJson<LocalTop5>(
      staticDataUrl(`${encodeURIComponent(dateSlug)}/local-top5.json`),
    )
  }
  return fetchJson<LocalTop5>(`/api/local-top5/${encodeURIComponent(dateSlug)}`)
}

export function fetchCoastalKatte(dateSlug: string): Promise<CoastalKatteTop5> {
  if (useStaticData) {
    return fetchJson<CoastalKatteTop5>(
      staticDataUrl(`${encodeURIComponent(dateSlug)}/coastal-katte.json`),
    )
  }
  return fetchJson<CoastalKatteTop5>(
    `/api/coastal-katte/${encodeURIComponent(dateSlug)}`,
  )
}

export function fetchFullPaper(dateSlug: string): Promise<FullPaper> {
  return fetchFullPaperFromFirestore(dateSlug)
}
