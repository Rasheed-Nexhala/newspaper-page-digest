import type {
  CoastalKatteTop5,
  DateEntry,
  LocalTop5,
  SavedArticlesFile,
  SavedStory,
} from './types'

/** Production / preview: static files under public/data. Dev: Vite /api middleware. */
const useStaticData = !import.meta.env.DEV

/** Saving mutates work/Saved on disk — only available via the Vite dev API. */
export const canMutateSaved = import.meta.env.DEV

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

function emptySavedFile(): SavedArticlesFile {
  return { updated: null, items: [] }
}

export async function fetchSaved(): Promise<SavedArticlesFile> {
  if (useStaticData) {
    try {
      return await fetchJson<SavedArticlesFile>(staticDataUrl('saved.json'))
    } catch {
      return emptySavedFile()
    }
  }
  return fetchJson<SavedArticlesFile>('/api/saved')
}

export async function addSavedStory(
  story: SavedStory,
): Promise<SavedArticlesFile> {
  if (!canMutateSaved) {
    throw new Error('Saving is only available in local npm run dev')
  }
  const res = await fetch('/api/saved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(story),
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) detail = body.error
    } catch {
      // ignore
    }
    throw new Error(detail)
  }
  return res.json() as Promise<SavedArticlesFile>
}

export async function removeSavedStory(
  id: string,
): Promise<SavedArticlesFile> {
  if (!canMutateSaved) {
    throw new Error('Unsaving is only available in local npm run dev')
  }
  const res = await fetch(`/api/saved/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) detail = body.error
    } catch {
      // ignore
    }
    throw new Error(detail)
  }
  return res.json() as Promise<SavedArticlesFile>
}
