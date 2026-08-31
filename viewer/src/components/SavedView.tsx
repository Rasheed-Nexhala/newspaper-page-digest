import type { CoastalKatteItem, SavedStory, StoryItem } from '../types'
import { StoryItemRow } from './StoryItem'

function scopeLabel(scope: string): string {
  return scope.replaceAll('_', ' ')
}

type SavedViewProps = {
  items: SavedStory[]
  canMutate: boolean
  onUnsave: (id: string) => void
  mutatingId: string | null
  error: string | null
}

export function SavedView({
  items,
  canMutate,
  onUnsave,
  mutatingId,
  error,
}: SavedViewProps) {
  return (
    <div className="view-panel">
      <header className="mb-6 sm:mb-8">
        <p className="text-[0.7rem] font-medium tracking-[0.2em] text-[var(--sea)] uppercase">
          Saved
        </p>
        <h2 className="mt-2 font-display text-2xl text-[var(--ink)] sm:text-3xl md:text-4xl">
          Saved articles
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          Newest saves on top · stored in{' '}
          <code className="text-[var(--sea)]">work/Saved/saved-articles.json</code>
          {!canMutate && (
            <>
              {' '}
              · edit/save locally with <code className="text-[var(--sea)]">npm run dev</code>,
              then commit to update the site
            </>
          )}
        </p>
      </header>

      {error && (
        <p className="mb-4 text-sm text-[var(--sunset)]" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="py-10 text-[var(--ink-muted)] italic sm:py-12">
          No saved articles yet. Open a day&apos;s Top 5 and tap Save.
        </p>
      ) : (
        <div>
          {items.map((saved, i) => {
            const item: StoryItem | CoastalKatteItem = {
              rank: saved.rank,
              headline: saved.headline,
              blurb: saved.blurb,
              kind: saved.kind,
              scope: saved.scope,
              sources: saved.sources,
              ...(saved.why_channel
                ? {
                    source_bucket: saved.source_bucket ?? '',
                    local_top_rank: saved.local_top_rank ?? saved.rank,
                    why_channel: saved.why_channel,
                  }
                : {}),
            }
            const listLabel =
              saved.list === 'coastal' ? 'Coastal Katte' : 'Daily Top 5'
            const bucketBit = saved.bucket
              ? ` · ${scopeLabel(String(saved.bucket))}`
              : ''
            return (
              <StoryItemRow
                key={saved.id}
                item={item}
                index={i}
                showWhy={Boolean(saved.why_channel)}
                saved
                saveDisabled={!canMutate || mutatingId === saved.id}
                onToggleSave={() => onUnsave(saved.id)}
                metaLine={`${saved.date} · ${listLabel}${bucketBit}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
