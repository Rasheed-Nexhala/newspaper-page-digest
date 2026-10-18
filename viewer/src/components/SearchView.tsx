import { useEffect, useMemo, useState } from 'react'
import {
  catalogArticleMatches,
  // Disabled: Full Paper search results —
  // catalogToNewsItem,
  // catalogToOpinionItem,
  catalogToSavedArticle,
  catalogToStoryItem,
  isTopStoryOrigin,
} from '../lib/articles'
import { makeSavedArticleId } from '../lib/articleId'
import type { CatalogArticle } from '../types'
// Disabled: Full Paper search results —
// import { FullPaperNewsCard, FullPaperOpinionCard } from './FullPaperCard'
import { StoryItemRow } from './StoryItem'

const ORIGIN_LABEL: Record<CatalogArticle['origin'], string> = {
  local_top5: 'Daily Top 5',
  coastal_katte: 'Coastal Katte',
  // Disabled: Full Paper search results
  full_paper_news: 'Full Paper · News',
  full_paper_technology: 'Full Paper · Technology',
  full_paper_opinion: 'Full Paper · Opinion',
}

function isActiveSearchOrigin(origin: CatalogArticle['origin']): boolean {
  // Disabled: Full Paper — exclude from search
  return origin === 'local_top5' || origin === 'coastal_katte'
}

/** Cap DOM size — a broad query like "Mangaluru" can match thousands of rows. */
const SEARCH_RESULT_LIMIT = 40

type SearchViewProps = {
  articles: CatalogArticle[]
  loading: boolean
  error: string | null
  isSaved: (articleId: string) => boolean
  onToggleSave: (article: CatalogArticle) => Promise<void>
}

function bookmarkId(article: CatalogArticle): string {
  return makeSavedArticleId(catalogToSavedArticle(article))
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

  const searchableArticles = useMemo(
    () => articles.filter((article) => isActiveSearchOrigin(article.origin)),
    [articles],
  )

  const matched = useMemo(() => {
    if (debounced.trim().length < 2) return []
    return searchableArticles
      .filter((article) => catalogArticleMatches(article, debounced))
      .sort((a, b) => {
        if (a.date_slug === b.date_slug) {
          const originRank = (o: CatalogArticle['origin']) =>
            o === 'coastal_katte' ? 0 : o === 'local_top5' ? 1 : 2
          const byOrigin = originRank(a.origin) - originRank(b.origin)
          if (byOrigin !== 0) return byOrigin
          return a.sort_index - b.sort_index
        }
        return a.date_slug < b.date_slug ? 1 : -1
      })
  }, [searchableArticles, debounced])

  const results = matched.slice(0, SEARCH_RESULT_LIMIT)
  const hiddenCount = matched.length - results.length
  const tooShort = debounced.trim().length < 2

  return (
    <div className="view-panel">
      <header className="mb-6 sm:mb-8">
        <p className="text-[0.7rem] font-medium tracking-[0.2em] text-[var(--sea)] uppercase">
          Search
        </p>
        <h2 className="mt-2 font-display text-2xl text-[var(--ink)] sm:text-3xl md:text-4xl">
          Daily archive
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          Search Daily Top 5 and Coastal Katte stories across every synced day.
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
          Enter two or more characters to search {searchableArticles.length}{' '}
          articles.
        </p>
      )}

      {!loading && !error && !tooShort && matched.length === 0 && (
        <p className="py-8 text-[var(--ink-muted)] italic">No matching stories.</p>
      )}

      {!loading && !error && matched.length > 0 && (
        <p className="mb-4 text-xs tracking-wide text-[var(--ink-soft)] uppercase">
          {matched.length === 1
            ? '1 result'
            : hiddenCount > 0
              ? `Showing ${results.length} of ${matched.length} results — refine your search for more`
              : `${matched.length} results`}
        </p>
      )}

      {results.map((article, index) => {
        const saved = isSaved(bookmarkId(article))
        return (
          <div key={article.id}>
            <p className="pt-2 text-[0.65rem] font-medium tracking-[0.16em] text-[var(--sea)] uppercase">
              {article.date} · {ORIGIN_LABEL[article.origin]}
            </p>
            {isTopStoryOrigin(article.origin) ? (
              <StoryItemRow
                item={catalogToStoryItem(article)}
                index={index}
                showWhy={article.origin === 'coastal_katte'}
                isSaved={saved}
                onToggleSave={() => onToggleSave(article)}
              />
            ) : null}
            {/* Disabled: Full Paper search results
            ) : article.origin === 'full_paper_opinion' ? (
              <FullPaperOpinionCard
                item={catalogToOpinionItem(article)}
                index={index}
                isSaved={saved}
                onToggleSave={() => onToggleSave(article)}
              />
            ) : (
              <FullPaperNewsCard
                item={catalogToNewsItem(article)}
                index={index}
                isSaved={saved}
                onToggleSave={() => onToggleSave(article)}
              />
            )}
            */}
          </div>
        )
      })}
    </div>
  )
}
