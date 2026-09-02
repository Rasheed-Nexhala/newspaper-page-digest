import type { CoastalKatteItem, CoastalKatteTop5 } from '../types'
import { StoryItemRow } from './StoryItem'

type CoastalKatteViewProps = {
  data: CoastalKatteTop5
  isSaved: (articleId: string) => boolean
  articleIdForItem: (item: CoastalKatteItem) => string
  onToggleSave: (item: CoastalKatteItem) => Promise<void>
}

export function CoastalKatteView({
  data,
  isSaved,
  articleIdForItem,
  onToggleSave,
}: CoastalKatteViewProps) {
  return (
    <div className="view-panel" key={data.date_slug}>
      <header className="mb-6 sm:mb-8">
        <p className="text-[0.7rem] font-medium tracking-[0.2em] text-[var(--sunset)] uppercase">
          @coastal_katte
        </p>
        <h2 className="mt-2 font-display text-2xl text-[var(--ink)] sm:text-3xl md:text-4xl">
          Coastal Katte Top 5
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          {data.date} · {data.candidate_count} candidates → {data.selected_count}{' '}
          selected
        </p>
      </header>

      {data.items.length === 0 ? (
        <p className="py-10 text-[var(--ink-muted)] italic sm:py-12">
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
              isSaved={isSaved(articleIdForItem(item))}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  )
}
