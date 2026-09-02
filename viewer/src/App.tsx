import { useEffect, useMemo, useState } from 'react'
import { fetchCoastalKatte, fetchDates, fetchFullPaper, fetchLocalTop5 } from './api'
import { CoastalKatteView } from './components/CoastalKatteView'
import { DatePicker } from './components/DatePicker'
import { FullPaperView } from './components/FullPaperView'
import { LocalTop5View } from './components/LocalTop5View'
import { SavedArticlesView } from './components/SavedArticlesView'
import { SearchView } from './components/SearchView'
import { useAuth } from './hooks/useAuth'
import {
  catalogToSavedArticle,
  fetchAllCatalogArticles,
} from './lib/articles'
import {
  makeSavedArticleId,
  saveArticle,
  subscribeSavedArticles,
  unsaveArticle,
} from './lib/savedArticles'
import type {
  CatalogArticle,
  CoastalKatteItem,
  CoastalKatteTop5,
  DateEntry,
  FullPaper,
  FullPaperNewsItem,
  FullPaperOpinionItem,
  LocalTop5,
  PrimaryView,
  SavedArticle,
  SavedArticleOrigin,
  StoryItem,
} from './types'

function hasFullPaper(entry: DateEntry | undefined): boolean {
  return entry?.has_full_paper === true
}

function resolveView(
  requested: PrimaryView,
  entry: DateEntry | undefined,
): PrimaryView {
  if (requested === 'saved') return 'saved'
  if (requested === 'search') return 'search'
  if (!entry) return requested
  if (requested === 'coastal' && entry.has_coastal_katte) return 'coastal'
  if (requested === 'local' && entry.has_local_top5) return 'local'
  if (requested === 'full' && hasFullPaper(entry)) return 'full'
  if (entry.has_local_top5) return 'local'
  if (entry.has_coastal_katte) return 'coastal'
  if (hasFullPaper(entry)) return 'full'
  return requested
}

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

function todayDateSlug(now = new Date()): string {
  const day = now.getDate()
  const month = MONTH_ABBR[now.getMonth()]
  const year = now.getFullYear()
  return `${day}-${month}-${year}`
}

function readDateFromUrl(): string {
  try {
    return new URLSearchParams(window.location.search).get('date') ?? ''
  } catch {
    return ''
  }
}

function writeDateToUrl(slug: string) {
  const url = new URL(window.location.href)
  if (slug) {
    url.searchParams.set('date', slug)
  } else {
    url.searchParams.delete('date')
  }
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function pickInitialSlug(list: DateEntry[], preferred: string): string {
  if (preferred && list.some((d) => d.date_slug === preferred)) return preferred

  const today = todayDateSlug()
  if (list.some((d) => d.date_slug === today)) return today

  // dates.json is newest-first — fall back to the latest available edition
  return list[0]?.date_slug ?? ''
}

function normalizeScope(scope: string): string {
  return scope.replaceAll(' ', '_')
}

function articleFromTopStory(
  item: StoryItem | CoastalKatteItem,
  dateSlug: string,
  date: string,
  origin: SavedArticleOrigin,
): SavedArticle {
  return {
    id: '',
    date_slug: dateSlug,
    date,
    origin,
    headline: item.headline,
    summary: item.blurb,
    kind: item.kind,
    scope: normalizeScope(item.scope),
    sources: item.sources,
    saved_at: '',
    rank: item.rank,
    source_bucket: 'source_bucket' in item ? item.source_bucket : undefined,
    local_top_rank: 'local_top_rank' in item ? item.local_top_rank : undefined,
    why_channel: 'why_channel' in item ? item.why_channel : undefined,
  }
}

function articleFromFullPaperNews(
  item: FullPaperNewsItem,
  dateSlug: string,
  date: string,
  origin: 'full_paper_news' | 'full_paper_technology',
): SavedArticle {
  return {
    id: '',
    date_slug: dateSlug,
    date,
    origin,
    headline: item.headline,
    summary: item.gist,
    kind: item.kind,
    scope: normalizeScope(item.scope),
    sources: item.sources,
    saved_at: '',
    rank: item.rank,
    paragraph: item.paragraph,
    what_this_is: item.what_this_is,
    important_points: item.important_points,
  }
}

function articleFromFullPaperOpinion(
  item: FullPaperOpinionItem,
  dateSlug: string,
  date: string,
): SavedArticle {
  return {
    id: '',
    date_slug: dateSlug,
    date,
    origin: 'full_paper_opinion',
    headline: item.headline,
    summary: item.gist,
    kind: item.kind,
    scope: normalizeScope(item.scope),
    sources: item.sources,
    saved_at: '',
    points: item.points,
  }
}

export default function App() {
  const [dates, setDates] = useState<DateEntry[]>([])
  const [dateSlug, setDateSlug] = useState(() => readDateFromUrl())
  const [view, setView] = useState<PrimaryView>('local')
  const [datesLoading, setDatesLoading] = useState(true)
  const [datesError, setDatesError] = useState<string | null>(null)
  const [localData, setLocalData] = useState<LocalTop5 | null>(null)
  const [coastalData, setCoastalData] = useState<CoastalKatteTop5 | null>(null)
  const [fullPaperData, setFullPaperData] = useState<FullPaper | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const [savedItems, setSavedItems] = useState<SavedArticle[]>([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedError, setSavedError] = useState<string | null>(null)
  const [catalogArticles, setCatalogArticles] = useState<CatalogArticle[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const { user, loading: authLoading, error: authError, signInWithGoogle, signOutUser, setAuthError } =
    useAuth()

  const selected = dates.find((d) => d.date_slug === dateSlug)
  const activeView = resolveView(view, selected)
  const savedIds = useMemo(() => new Set(savedItems.map((item) => item.id)), [savedItems])

  function selectDate(slug: string) {
    setDateSlug(slug)
    writeDateToUrl(slug)
  }

  useEffect(() => {
    let cancelled = false
    setDatesLoading(true)
    setDatesError(null)
    fetchDates()
      .then((list) => {
        if (cancelled) return
        setDates(list)
        const fromUrl = readDateFromUrl()
        setDateSlug((prev) => {
          const next = pickInitialSlug(list, fromUrl || prev)
          writeDateToUrl(next)
          return next
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setDatesError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setDatesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!dateSlug || !selected) {
      setLocalData(null)
      setCoastalData(null)
      setFullPaperData(null)
      setContentLoading(false)
      return
    }

    let cancelled = false
    setContentLoading(true)
    setContentError(null)

    const tasks: Promise<void>[] = []

    if (selected.has_local_top5) {
      tasks.push(
        fetchLocalTop5(dateSlug).then((data) => {
          if (!cancelled) setLocalData(data)
        }),
      )
    } else if (!cancelled) {
      setLocalData(null)
    }

    if (selected.has_coastal_katte) {
      tasks.push(
        fetchCoastalKatte(dateSlug).then((data) => {
          if (!cancelled) setCoastalData(data)
        }),
      )
    } else if (!cancelled) {
      setCoastalData(null)
    }

    if (hasFullPaper(selected)) {
      tasks.push(
        fetchFullPaper(dateSlug).then((data) => {
          if (!cancelled) setFullPaperData(data)
        }),
      )
    } else if (!cancelled) {
      setFullPaperData(null)
    }

    Promise.all(tasks)
      .catch((err: unknown) => {
        if (cancelled) return
        setContentError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setContentLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [dateSlug, selected])

  useEffect(() => {
    if (!user) {
      setSavedItems([])
      setSavedError(null)
      setSavedLoading(false)
      return
    }
    setSavedLoading(true)
    setSavedError(null)
    const unsubscribe = subscribeSavedArticles(
      user.uid,
      (items) => {
        setSavedItems(items)
        setSavedLoading(false)
      },
      (message) => {
        setSavedError(message)
        setSavedLoading(false)
      },
    )
    return unsubscribe
  }, [user])

  useEffect(() => {
    let cancelled = false
    setSearchLoading(true)
    setSearchError(null)
    fetchAllCatalogArticles()
      .then((items) => {
        if (!cancelled) setCatalogArticles(items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setSearchError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function refreshDates() {
    setDatesLoading(true)
    setDatesError(null)
    fetchDates()
      .then((list) => {
        setDates(list)
        setDateSlug((prev) => {
          const next = pickInitialSlug(list, prev)
          writeDateToUrl(next)
          return next
        })
      })
      .catch((err: unknown) => {
        setDatesError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => setDatesLoading(false))
  }

  const showLocal = activeView === 'local'
  const showFull = activeView === 'full'
  const showCoastal = activeView === 'coastal'
  const showSaved = activeView === 'saved'
  const showSearch = activeView === 'search'
  const showEdition = !showSaved && !showSearch
  const missingForView =
    selected &&
    showEdition &&
    ((showLocal && !selected.has_local_top5) ||
      (showCoastal && !selected.has_coastal_katte) ||
      (showFull && !hasFullPaper(selected)))

  async function ensureSignedIn() {
    setAuthError(null)
    if (user) return user
    return signInWithGoogle()
  }

  async function toggleSaved(article: SavedArticle) {
    try {
      const activeUser = await ensureSignedIn()
      const articleId = makeSavedArticleId(article)
      if (savedIds.has(articleId)) {
        await unsaveArticle(activeUser.uid, articleId)
      } else {
        await saveArticle(activeUser.uid, article)
      }
      setSavedError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setAuthError(message)
      setSavedError(message)
    }
  }

  const articleIdForLocal = (item: StoryItem) =>
    makeSavedArticleId(articleFromTopStory(item, localData?.date_slug ?? '', localData?.date ?? '', 'local_top5'))
  const articleIdForCoastal = (item: CoastalKatteItem) =>
    makeSavedArticleId(
      articleFromTopStory(
        item,
        coastalData?.date_slug ?? '',
        coastalData?.date ?? '',
        'coastal_katte',
      ),
    )
  const articleIdForNews = (item: FullPaperNewsItem, origin: 'news' | 'technology') =>
    makeSavedArticleId(
      articleFromFullPaperNews(
        item,
        fullPaperData?.date_slug ?? '',
        fullPaperData?.date ?? '',
        origin === 'technology' ? 'full_paper_technology' : 'full_paper_news',
      ),
    )
  const articleIdForOpinion = (item: FullPaperOpinionItem) =>
    makeSavedArticleId(
      articleFromFullPaperOpinion(
        item,
        fullPaperData?.date_slug ?? '',
        fullPaperData?.date ?? '',
      ),
    )

  return (
    <div className="app-shell min-h-dvh">
      <div className="atmosphere" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-8 sm:px-8 sm:pt-14">
        <header className="hero-block mb-8 sm:mb-12">
          <p className="font-display text-4xl leading-[1.05] tracking-tight text-[var(--ink)] sm:text-5xl md:text-6xl">
            Local Top
            <span className="text-[var(--sea)]"> / </span>
            Coastal Katte
          </p>
          <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-[var(--ink-muted)] sm:mt-4 sm:text-base">
            Daily Top 5, Coastal Katte, Full Paper, and search across Full Paper
            days — pick a date or step Older / Newer.
          </p>

          <div className="glass-panel mt-6 p-4 sm:mt-8 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <DatePicker
                dates={dates}
                value={dateSlug}
                onChange={selectDate}
                loading={datesLoading}
              />
              <button
                type="button"
                className="glass-chip self-start px-3.5 py-2.5 text-xs tracking-[0.14em] text-[var(--sea)] uppercase transition-colors hover:bg-[color-mix(in_oklab,white_70%,var(--foam))] sm:self-end"
                onClick={refreshDates}
              >
                Refresh dates
              </button>
            </div>

            {datesError && (
              <p className="mt-4 text-sm text-[var(--sunset)]" role="alert">
                {datesError}
              </p>
            )}
          </div>
        </header>

        <nav className="glass-nav mb-6 sm:mb-8" aria-label="Feed">
          {(
            [
              {
                id: 'local' as const,
                label: 'Daily Top 5',
                enabled: selected?.has_local_top5 ?? false,
              },
              {
                id: 'full' as const,
                label: 'Full paper',
                enabled: hasFullPaper(selected),
              },
              {
                id: 'coastal' as const,
                label: 'Coastal Katte',
                enabled: selected?.has_coastal_katte ?? false,
              },
              {
                id: 'saved' as const,
                label: 'Saved',
                enabled: true,
              },
              {
                id: 'search' as const,
                label: 'Search',
                enabled: true,
              },
            ] as const
          ).map((tab) => {
            const active = activeView === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                disabled={!tab.enabled && !!selected}
                data-active={active ? 'true' : 'false'}
                aria-current={active ? 'page' : undefined}
                className={`glass-tab px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? 'text-[var(--ink)]'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
                onClick={() => setView(tab.id)}
              >
                {tab.label}
                {active && (
                  <span
                    className={`absolute inset-x-3 bottom-1.5 h-0.5 rounded-full ${
                      tab.id === 'coastal'
                        ? 'bg-[var(--sunset)]'
                        : tab.id === 'full'
                          ? 'bg-[var(--lagoon)]'
                          : tab.id === 'saved'
                            ? 'bg-[var(--ink)]'
                            : tab.id === 'search'
                              ? 'bg-[var(--sea-deep)]'
                          : 'bg-[var(--sea)]'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </nav>

        <main className="glass-panel-strong px-4 py-5 sm:px-6 sm:py-7">
          {datesLoading && dates.length === 0 && (
            <p className="py-12 text-center text-[var(--ink-muted)] sm:py-16">
              Looking for editions in work/…
            </p>
          )}

          {!showSaved && !showSearch && !datesLoading && dates.length === 0 && !datesError && (
            <p className="py-12 text-center text-[var(--ink-muted)] sm:py-16">
              No Top 5 JSON found yet. Run{' '}
              <code className="text-[var(--sea)]">/daily-after-digest</code> after
              digesting papers, then refresh dates.
            </p>
          )}

          {contentLoading && showEdition && (
            <p className="py-8 text-[var(--ink-muted)]">Loading edition…</p>
          )}

          {contentError && showEdition && (
            <p className="py-4 text-sm text-[var(--sunset)]" role="alert">
              {contentError}
            </p>
          )}

          {!contentLoading && showEdition && missingForView && (
            <p className="py-10 text-[var(--ink-muted)] italic sm:py-12">
              {showLocal
                ? 'Daily Top 5 is not available for this date.'
                : showFull
                  ? 'Full paper is not available for this date.'
                  : 'Coastal Katte Top 5 is not available for this date.'}
            </p>
          )}

          {!contentLoading && !contentError && showLocal && localData && (
            <LocalTop5View
              data={localData}
              isSaved={(articleId) => savedIds.has(articleId)}
              articleIdForItem={articleIdForLocal}
              onToggleSave={(item) =>
                toggleSaved(
                  articleFromTopStory(
                    item,
                    localData.date_slug,
                    localData.date,
                    'local_top5',
                  ),
                )
              }
            />
          )}

          {!contentLoading && !contentError && showFull && fullPaperData && (
            <FullPaperView
              data={fullPaperData}
              isSaved={(articleId) => savedIds.has(articleId)}
              articleIdForNews={articleIdForNews}
              articleIdForOpinion={articleIdForOpinion}
              onToggleNewsSave={(item, origin) =>
                toggleSaved(
                  articleFromFullPaperNews(
                    item,
                    fullPaperData.date_slug,
                    fullPaperData.date,
                    origin === 'technology'
                      ? 'full_paper_technology'
                      : 'full_paper_news',
                  ),
                )
              }
              onToggleOpinionSave={(item) =>
                toggleSaved(
                  articleFromFullPaperOpinion(
                    item,
                    fullPaperData.date_slug,
                    fullPaperData.date,
                  ),
                )
              }
            />
          )}

          {!contentLoading && !contentError && showCoastal && coastalData && (
            <CoastalKatteView
              data={coastalData}
              isSaved={(articleId) => savedIds.has(articleId)}
              articleIdForItem={articleIdForCoastal}
              onToggleSave={(item) =>
                toggleSaved(
                  articleFromTopStory(
                    item,
                    coastalData.date_slug,
                    coastalData.date,
                    'coastal_katte',
                  ),
                )
              }
            />
          )}

          {showSearch && (
            <SearchView
              articles={catalogArticles}
              loading={searchLoading}
              error={searchError}
              isSaved={(articleId) => savedIds.has(articleId)}
              onToggleSave={(item) => toggleSaved(catalogToSavedArticle(item))}
            />
          )}

          {showSaved && (
            <SavedArticlesView
              user={user}
              authLoading={authLoading}
              authError={authError}
              items={savedItems}
              loading={savedLoading}
              error={savedError}
              onSignIn={signInWithGoogle}
              onSignOut={signOutUser}
              onRemove={(item) => {
                if (!user) return Promise.resolve()
                return unsaveArticle(user.uid, item.id)
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}
