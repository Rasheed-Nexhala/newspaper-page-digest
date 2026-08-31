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

export default function App() {
  const [dates, setDates] = useState<DateEntry[]>([])
  const [dateSlug, setDateSlug] = useState('')
  const [view, setView] = useState<PrimaryView>('local')
  const [datesLoading, setDatesLoading] = useState(true)
  const [datesError, setDatesError] = useState<string | null>(null)
  const [localData, setLocalData] = useState<LocalTop5 | null>(null)
  const [coastalData, setCoastalData] = useState<CoastalKatteTop5 | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)

  const selected = dates.find((d) => d.date_slug === dateSlug)
  const activeView = resolveView(view, selected)

  useEffect(() => {
    let cancelled = false
    setDatesLoading(true)
    setDatesError(null)
    fetchDates()
      .then((list) => {
        if (cancelled) return
        setDates(list)
        setDateSlug((prev) => {
          if (prev && list.some((d) => d.date_slug === prev)) return prev
          return list[0]?.date_slug ?? ''
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
          if (prev && list.some((d) => d.date_slug === prev)) return prev
          return list[0]?.date_slug ?? ''
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
      <div className="relative mx-auto max-w-3xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <header className="hero-block mb-12">
          <p className="font-display text-5xl leading-none tracking-tight text-[var(--ink)] sm:text-6xl">
            Local Top
            <span className="text-[var(--sea)]"> / </span>
            Coastal Katte
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--ink-muted)]">
            Daily Top 5 digests from Mangaluru and coastal Karnataka — pick a
            date, read Local or channel picks.
          </p>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <DatePicker
              dates={dates}
              value={dateSlug}
              onChange={setDateSlug}
              loading={datesLoading}
            />
            <button
              type="button"
              className="self-start text-xs tracking-[0.14em] text-[var(--sea)] uppercase underline-offset-4 hover:underline sm:self-end"
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
        </header>

        <nav
          className="mb-10 flex gap-1 border-b border-[var(--line)]"
          aria-label="Feed"
        >
          {(
            [
              {
                id: 'local' as const,
                label: 'Local Top 5',
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
                className={`relative px-4 py-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? 'font-medium text-[var(--ink)]'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
                onClick={() => setView(tab.id)}
              >
                {tab.label}
                {active && (
                  <span
                    className={`absolute inset-x-3 -bottom-px h-0.5 ${
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

        <main>
          {datesLoading && dates.length === 0 && (
            <p className="py-16 text-center text-[var(--ink-muted)]">
              Looking for editions in work/…
            </p>
          )}

          {!datesLoading && dates.length === 0 && !datesError && (
            <p className="py-16 text-center text-[var(--ink-muted)]">
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
            <p className="py-12 text-[var(--ink-muted)] italic">
              {showLocal
                ? 'Local Top 5 is not available for this date.'
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
