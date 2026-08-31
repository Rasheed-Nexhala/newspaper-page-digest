import type { DateEntry } from '../types'

type DatePickerProps = {
  dates: DateEntry[]
  value: string
  onChange: (slug: string) => void
  loading?: boolean
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 6L9 12l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DatePicker({ dates, value, onChange, loading }: DatePickerProps) {
  const index = dates.findIndex((d) => d.date_slug === value)
  const position = index >= 0 ? index + 1 : 0
  // dates are newest-first: Newer = lower index, Older = higher index
  const canNewer = index > 0
  const canOlder = index >= 0 && index < dates.length - 1
  const disabled = loading || dates.length === 0

  function goNewer() {
    if (!canNewer) return
    onChange(dates[index - 1].date_slug)
  }

  function goOlder() {
    if (!canOlder) return
    onChange(dates[index + 1].date_slug)
  }

  return (
    <div className="date-picker flex min-w-0 flex-1 flex-col gap-2">
      <span className="text-[0.65rem] font-medium tracking-[0.18em] text-[var(--ink-soft)] uppercase">
        Edition date
      </span>

      <div className="flex min-w-0 items-stretch gap-2">
        <button
          type="button"
          className="nav-day-btn glass-chip inline-flex shrink-0 items-center justify-center px-2.5 text-[var(--sea)] transition-colors hover:border-[var(--sea)] hover:bg-[color-mix(in_oklab,white_70%,var(--foam))] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[var(--glass-border)] disabled:hover:bg-[color-mix(in_oklab,white_50%,transparent)]"
          aria-label="Older edition"
          title="Older"
          disabled={disabled || !canOlder}
          onClick={goOlder}
        >
          <ChevronLeft />
          <span className="sr-only">Older</span>
        </button>

        <label className="min-w-0 flex-1">
          <span className="sr-only">Select edition date</span>
          <select
            className="glass-field w-full min-w-0 cursor-pointer appearance-none py-2.5 pr-8 pl-3 font-display text-base text-[var(--ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--lagoon)] focus:shadow-[0_0_0_2px_color-mix(in_oklab,var(--lagoon)_35%,transparent)] disabled:opacity-50 sm:text-lg"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Select edition date"
          >
            {dates.length === 0 && <option value="">No editions yet</option>}
            {dates.map((d) => (
              <option key={d.date_slug} value={d.date_slug}>
                {d.date ?? d.date_slug}
                {!d.has_local_top5
                  ? ' · Coastal only'
                  : !d.has_coastal_katte
                    ? ' · Local only'
                    : ''}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="nav-day-btn glass-chip inline-flex shrink-0 items-center justify-center px-2.5 text-[var(--sea)] transition-colors hover:border-[var(--sea)] hover:bg-[color-mix(in_oklab,white_70%,var(--foam))] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[var(--glass-border)] disabled:hover:bg-[color-mix(in_oklab,white_50%,transparent)]"
          aria-label="Newer edition"
          title="Newer"
          disabled={disabled || !canNewer}
          onClick={goNewer}
        >
          <ChevronRight />
          <span className="sr-only">Newer</span>
        </button>
      </div>

      {dates.length > 0 && (
        <p className="text-xs tracking-wide text-[var(--ink-soft)]">
          {dates.length === 1 ? (
            <>1 edition available · Older / Newer unlock when more days exist</>
          ) : (
            <>
              {position} of {dates.length} editions
              <span className="mx-1.5 opacity-40">·</span>
              <span className="text-[var(--ink-muted)]">Older ← → Newer</span>
            </>
          )}
        </p>
      )}
    </div>
  )
}
