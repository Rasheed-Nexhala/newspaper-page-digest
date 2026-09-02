import type { SourceRef } from '../types'

export function sourceKey(s: SourceRef): string {
  return `${s.paper}|${s.edition}|${s.page}|${s.index}`
}

export function fallbackKey(article: {
  headline: string
  scope: string
  kind: string
}): string {
  return `${article.scope}|${article.kind}|${article.headline.trim().toLowerCase()}`
}

export function hashString(value: string): string {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return (hash >>> 0).toString(16)
}

export function makeSavedArticleId(article: {
  date_slug: string
  sources: SourceRef[]
  headline: string
  scope: string
  kind: string
}): string {
  const sourceFingerprint = article.sources.length
    ? [...article.sources].map(sourceKey).sort().join('||')
    : fallbackKey(article)
  return hashString(`${article.date_slug}::${sourceFingerprint}`)
}
