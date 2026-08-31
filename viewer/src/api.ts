import type { CoastalKatteTop5, DateEntry, LocalTop5 } from './types'

/** Production / preview: static files under public/data. Dev: Vite /api middleware. */
const useStaticData = !import.meta.env.DEV

function staticDataUrl(relPath: string): string {
  const base = import.meta.env.BASE_URL
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}data/${relPath}`
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
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
