import type { CoastalKatteItem, SourceRef, StoryItem } from '../types'

function formatSources(sources: SourceRef[]): string {
  if (!sources.length) return 'No source listed'
  return sources
    .map((s) => `${s.paper} ${s.edition} p.${s.page}`)
    .join(' · ')
}

function scopeLabel(scope: string): string {
  return scope.replaceAll('_', ' ')
}

type StoryItemProps = {
  item: StoryItem | CoastalKatteItem
  index: number
  showWhy?: boolean
}

export function StoryItemRow({ item, index, showWhy = false }: StoryItemProps) {
  const why = 'why_channel' in item ? item.why_channel : undefined
  const sourceBucket =
    'source_bucket' in item ? item.source_bucket : undefined
  const localRank =
    'local_top_rank' in item ? item.local_top_rank : undefined

  return (
    <article
      className="story-row group border-b border-[var(--line)] py-7 last:border-b-0"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 sm:gap-x-7">
        <div className="rank-num font-display text-4xl leading-none text-[var(--sea)] sm:text-5xl">
          {String(item.rank).padStart(2, '0')}
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-snug text-[var(--ink)] sm:text-2xl">
            {item.headline}
          </h3>
          <p className="mt-3 max-w-prose text-[0.975rem] leading-relaxed text-[var(--ink-muted)]">
            {item.blurb}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs tracking-wide text-[var(--ink-soft)] uppercase">
            <span className="scope-pill">{scopeLabel(item.scope)}</span>
            {sourceBucket && (
              <span className="opacity-80">
                from {scopeLabel(sourceBucket)}
                {localRank != null ? ` #${localRank}` : ''}
              </span>
            )}
            <span className="opacity-70 normal-case tracking-normal">
              {formatSources(item.sources)}
            </span>
          </div>
          {showWhy && why && (
            <p className="why-line mt-4 max-w-prose border-l-2 border-[var(--lagoon)] pl-3 text-sm leading-relaxed text-[var(--sea-deep)]">
              <span className="font-medium text-[var(--sea)]">Why Coastal Katte — </span>
              {why}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
