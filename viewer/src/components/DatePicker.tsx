import type { DateEntry } from '../types'

type DatePickerProps = {
  dates: DateEntry[]
  value: string
  onChange: (slug: string) => void
  loading?: boolean
}

export function DatePicker({ dates, value, onChange, loading }: DatePickerProps) {
  return (
    <label className="date-picker flex min-w-0 flex-col gap-1.5">
      <span className="text-[0.65rem] font-medium tracking-[0.18em] text-[var(--ink-soft)] uppercase">
        Edition date
      </span>
      <select
        className="w-full max-w-md cursor-pointer appearance-none rounded-none border-0 border-b-2 border-[var(--sea)] bg-transparent py-2 pr-8 font-display text-lg text-[var(--ink)] outline-none transition-[border-color] focus:border-[var(--lagoon)] disabled:opacity-50"
        value={value}
        disabled={loading || dates.length === 0}
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
  )
}
