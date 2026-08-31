import type { CoastalKatteTop5 } from '../types'
import { StoryItemRow } from './StoryItem'

type CoastalKatteViewProps = {
  data: CoastalKatteTop5
}

export function CoastalKatteView({ data }: CoastalKatteViewProps) {
  return (
    <div className="view-panel" key={data.date_slug}>
      <header className="mb-8">
        <p className="text-[0.7rem] font-medium tracking-[0.2em] text-[var(--sunset)] uppercase">
          @coastal_katte
        </p>
        <h2 className="mt-2 font-display text-3xl text-[var(--ink)] sm:text-4xl">
          Coastal Katte Top 5
        </h2>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          {data.date} · {data.candidate_count} candidates → {data.selected_count}{' '}
          selected
        </p>
      </header>

      {data.items.length === 0 ? (
        <p className="py-12 text-[var(--ink-muted)] italic">
          No Coastal Katte picks for this day.
        </p>
      ) : (
        <div>
          {data.items.map((item, i) => (
            <StoryItemRow
              key={item.rank}
              item={item}
              index={i}
              showWhy
            />
          ))}
        </div>
      )}
    </div>
  )
}
