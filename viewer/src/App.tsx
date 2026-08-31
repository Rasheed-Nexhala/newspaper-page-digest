import { useEffect, useState } from 'react'
import { fetchCoastalKatte, fetchDates, fetchLocalTop5 } from './api'
import { CoastalKatteView } from './components/CoastalKatteView'
import { DatePicker } from './components/DatePicker'
import { LocalTop5View } from './components/LocalTop5View'
import type {
  CoastalKatteTop5,
  DateEntry,
  LocalTop5,
  PrimaryView,
} from './types'

function resolveView(
  requested: PrimaryView,
  entry: DateEntry | undefined,
): PrimaryView {
  if (!entry) return requested
  if (requested === 'coastal' && entry.has_coastal_katte) return 'coastal'
  if (requested === 'local' && entry.has_local_top5) return 'local'
  if (entry.has_local_top5) return 'local'
  if (entry.has_coastal_katte) return 'coastal'
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

export default function App() {
  const [dates, setDates] = useState<DateEntry[]>([])
  const [dateSlug, setDateSlug] = useState(() => readDateFromUrl())
  const [view, setView] = useState<PrimaryView>('local')
  const [datesLoading, setDatesLoading] = useState(true)
  const [datesError, setDatesError] = useState<string | null>(null)
  const [localData, setLocalData] = useState<LocalTop5 | null>(null)
  const [coastalData, setCoastalData] = useState<CoastalKatteTop5 | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)

  const selected = dates.find((d) => d.date_slug === dateSlug)
  const activeView = resolveView(view, selected)

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
  const missingForView =
    selected &&
    ((showLocal && !selected.has_local_top5) ||
      (!showLocal && !selected.has_coastal_katte))

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
            Daily Top 5 digests from Mangaluru and coastal Karnataka — pick a
            date or step Older / Newer, then read Local or channel picks.
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
                id: 'coastal' as const,
                label: 'Coastal Katte',
                enabled: selected?.has_coastal_katte ?? false,
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

          {!datesLoading && dates.length === 0 && !datesError && (
            <p className="py-12 text-center text-[var(--ink-muted)] sm:py-16">
              No Top 5 JSON found yet. Run{' '}
              <code className="text-[var(--sea)]">/daily-local-top</code> or{' '}
              <code className="text-[var(--sea)]">/coastal-katte-top5</code>, then
              refresh dates.
            </p>
          )}

          {contentLoading && (
            <p className="py-8 text-[var(--ink-muted)]">Loading edition…</p>
          )}

          {contentError && (
            <p className="py-4 text-sm text-[var(--sunset)]" role="alert">
              {contentError}
            </p>
          )}

          {!contentLoading && missingForView && (
            <p className="py-10 text-[var(--ink-muted)] italic sm:py-12">
              {showLocal
                ? 'Daily Top 5 is not available for this date.'
                : 'Coastal Katte Top 5 is not available for this date.'}
            </p>
          )}

          {!contentLoading && !contentError && showLocal && localData && (
            <LocalTop5View data={localData} />
          )}

          {!contentLoading && !contentError && !showLocal && coastalData && (
            <CoastalKatteView data={coastalData} />
          )}
        </main>
      </div>
    </div>
  )
}
