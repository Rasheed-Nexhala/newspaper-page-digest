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
  saved?: boolean
  saveDisabled?: boolean
  onToggleSave?: () => void
  metaLine?: string
}

export function StoryItemRow({
  item,
  index,
  showWhy = false,
  saved = false,
  saveDisabled = false,
  onToggleSave,
  metaLine,
}: StoryItemProps) {
  const why = 'why_channel' in item ? item.why_channel : undefined
  const sourceBucket =
    'source_bucket' in item ? item.source_bucket : undefined
  const localRank =
    'local_top_rank' in item ? item.local_top_rank : undefined

  return (
    <article
      className="story-row group border-b border-[var(--line)] py-5 last:border-b-0 sm:py-7"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 sm:gap-x-7">
        <div className="rank-num font-display text-3xl leading-none text-[var(--sea)] sm:text-4xl md:text-5xl">
          {String(item.rank).padStart(2, '0')}
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg leading-snug break-words text-[var(--ink)] sm:text-xl md:text-2xl">
              {item.headline}
            </h3>
            {onToggleSave && (
              <button
                type="button"
                className={`glass-chip shrink-0 px-2.5 py-1.5 text-[0.65rem] tracking-[0.12em] uppercase transition-colors ${
                  saved
                    ? 'text-[var(--sunset)]'
                    : 'text-[var(--sea)] hover:bg-[color-mix(in_oklab,white_70%,var(--foam))]'
                } disabled:cursor-not-allowed disabled:opacity-45`}
                aria-pressed={saved}
                disabled={saveDisabled}
                title={
                  saveDisabled
                    ? 'Saving writes work/Saved in local npm run dev'
                    : saved
                      ? 'Remove from saved'
                      : 'Save to repo file'
                }
                onClick={onToggleSave}
              >
                {saved ? 'Saved' : 'Save'}
              </button>
            )}
          </div>
          {metaLine && (
            <p className="mt-1.5 text-xs tracking-wide text-[var(--ink-soft)] uppercase">
              {metaLine}
            </p>
          )}
          <p className="mt-2.5 max-w-prose text-[0.925rem] leading-relaxed text-[var(--ink-muted)] sm:mt-3 sm:text-[0.975rem]">
            {item.blurb}
          </p>
          <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs tracking-wide text-[var(--ink-soft)] uppercase sm:mt-4">
            <span className="scope-pill">{scopeLabel(item.scope)}</span>
            {sourceBucket && (
              <span className="opacity-80">
                from {scopeLabel(sourceBucket)}
                {localRank != null ? ` #${localRank}` : ''}
              </span>
            )}
            <span className="opacity-70 normal-case tracking-normal break-words">
              {formatSources(item.sources)}
            </span>
          </div>
          {showWhy && why && (
            <p className="why-line why-glass mt-4 max-w-prose px-3 py-2.5 text-sm leading-relaxed text-[var(--sea-deep)]">
              <span className="font-medium text-[var(--sea)]">Why Coastal Katte — </span>
              {why}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
