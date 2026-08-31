import type { CoastalKatteTop5, DateEntry, LocalTop5 } from './types'

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
  return fetchJson<DateEntry[]>('/api/dates')
}

export function fetchLocalTop5(dateSlug: string): Promise<LocalTop5> {
  return fetchJson<LocalTop5>(`/api/local-top5/${encodeURIComponent(dateSlug)}`)
}

export function fetchCoastalKatte(dateSlug: string): Promise<CoastalKatteTop5> {
  return fetchJson<CoastalKatteTop5>(
    `/api/coastal-katte/${encodeURIComponent(dateSlug)}`,
  )
}
