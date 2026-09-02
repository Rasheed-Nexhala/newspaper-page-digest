/** Must stay identical to viewer/src/lib/articleId.ts */

export function sourceKey(s) {
  return `${s.paper}|${s.edition}|${s.page}|${s.index}`
}

export function fallbackKey(article) {
  return `${article.scope}|${article.kind}|${article.headline.trim().toLowerCase()}`
}

export function hashString(value) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return (hash >>> 0).toString(16)
}

export function makeSavedArticleId(article) {
  const sourceFingerprint = article.sources.length
    ? [...article.sources].map(sourceKey).sort().join('||')
    : fallbackKey(article)
  return hashString(`${article.date_slug}::${sourceFingerprint}`)
}
