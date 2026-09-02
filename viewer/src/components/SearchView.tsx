import { useEffect, useMemo, useState } from 'react'
import {
  catalogArticleMatches,
  catalogToNewsItem,
  catalogToOpinionItem,
} from '../lib/articles'
import type { CatalogArticle } from '../types'
import { FullPaperNewsCard, FullPaperOpinionCard } from './FullPaperCard'

const ORIGIN_LABEL: Record<CatalogArticle['origin'], string> = {
  full_paper_news: 'News',
  full_paper_technology: 'Technology',
  full_paper_opinion: 'Opinion',
}

type SearchViewProps = {
  articles: CatalogArticle[]
  loading: boolean
  error: string | null
  isSaved: (articleId: string) => boolean
  onToggleSave: (article: CatalogArticle) => Promise<void>
}

export function SearchView({
  articles,
  loading,
  error,
  isSaved,
  onToggleSave,
}: SearchViewProps) {
  const [rawQuery, setRawQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(rawQuery), 200)
    return () => window.clearTimeout(handle)
  }, [rawQuery])

  const results = useMemo(() => {
    if (debounced.trim().length < 2) return []
    return articles
      .filter((article) => catalogArticleMatches(article, debounced))
      .sort((a, b) => {
        if (a.date_slug === b.date_slug) return a.sort_index - b.sort_index
        return a.date_slug < b.date_slug ? 1 : -1
      })
  }, [articles, debounced])

  const tooShort = debounced.trim().length < 2

  return (
    <div className="view-panel">
      <header className="mb-6 sm:mb-8">
        <p className="text-[0.7rem] font-medium tracking-[0.2em] text-[var(--sea)] uppercase">
          Search
        </p>
        <h2 className="mt-2 font-display text-2xl text-[var(--ink)] sm:text-3xl md:text-4xl">
          Full Paper archive
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          Search headlines and blurbs across every Full Paper day in Firestore.
        </p>
        <label className="mt-5 block">
          <span className="text-[0.65rem] font-medium tracking-[0.18em] text-[var(--ink-soft)] uppercase">
            Find a story
          </span>
          <input
            type="search"
            value={rawQuery}
            onChange={(event) => setRawQuery(event.target.value)}
            placeholder="Type at least two letters…"
            className="glass-chip mt-2 w-full px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)]"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </header>

      {loading && (
        <p className="py-8 text-[var(--ink-muted)]">Loading articles…</p>
      )}

      {error && (
        <p className="py-4 text-sm text-[var(--sunset)]" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && tooShort && (
        <p className="py-8 text-[var(--ink-muted)]">
          Enter two or more characters to search {articles.length} articles.
        </p>
      )}

      {!loading && !error && !tooShort && results.length === 0 && (
        <p className="py-8 text-[var(--ink-muted)] italic">No matching stories.</p>
      )}

      {!loading && !error && results.length > 0 && (
        <p className="mb-4 text-xs tracking-wide text-[var(--ink-soft)] uppercase">
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </p>
      )}

      {results.map((article, index) => (
        <div key={article.id}>
          <p className="pt-2 text-[0.65rem] font-medium tracking-[0.16em] text-[var(--sea)] uppercase">
            {article.date} · {ORIGIN_LABEL[article.origin]}
          </p>
          {article.origin === 'full_paper_opinion' ? (
            <FullPaperOpinionCard
              item={catalogToOpinionItem(article)}
              index={index}
              isSaved={isSaved(article.id)}
              onToggleSave={() => onToggleSave(article)}
            />
          ) : (
            <FullPaperNewsCard
              item={catalogToNewsItem(article)}
              index={index}
              isSaved={isSaved(article.id)}
              onToggleSave={() => onToggleSave(article)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
