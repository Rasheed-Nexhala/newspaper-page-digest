import type { LocalBucketKey, SavedListKind, SourceRef } from '../types'

type SavedIdParts = {
  dateSlug: string
  list: SavedListKind
  bucket?: LocalBucketKey | string
  rank: number
  headline: string
  sources: SourceRef[]
}

/** Stable id so the same Top 5 row toggles instead of duplicating. */
export function buildSavedId({
  dateSlug,
  list,
  bucket,
  rank,
  headline,
  sources,
}: SavedIdParts): string {
  const sourceKey = sources
    .map((s) => `${s.paper}|${s.edition}|${s.page}|${s.index}`)
    .join(';')
  return [dateSlug, list, bucket ?? '', String(rank), headline, sourceKey].join(
    '::',
  )
}
