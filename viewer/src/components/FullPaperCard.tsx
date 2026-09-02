import type {
  FullPaperNewsItem,
  FullPaperOpinionItem,
  SourceRef,
} from '../types'

function formatSources(sources: SourceRef[]): string {
  if (!sources.length) return 'No source listed'
  return sources
    .map((s) => `${s.paper} ${s.edition} p.${s.page}`)
    .join(' · ')
}

function scopeLabel(scope: string): string {
  return scope.replaceAll('_', ' ')
}

type NewsCardProps = {
  item: FullPaperNewsItem
  index: number
  headingLevel?: 'h3' | 'h4'
  isSaved?: boolean
  onToggleSave?: (item: FullPaperNewsItem) => Promise<void>
}

export function FullPaperNewsCard({
  item,
  index,
  headingLevel = 'h3',
  isSaved = false,
  onToggleSave,
}: NewsCardProps) {
  const Heading = headingLevel
  const rank = item.rank
  const w = item.what_this_is

  return (
    <article
      className="story-row group border-b border-[var(--line)] py-5 last:border-b-0 sm:py-7"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="min-w-0">
        {rank != null && (
          <p className="mb-1.5 font-display text-2xl leading-none text-[var(--sea)] sm:text-3xl">
            {String(rank).padStart(2, '0')}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading className="font-display text-lg leading-snug break-words text-[var(--ink)] sm:text-xl md:text-2xl">
            {item.headline}
          </Heading>
          {onToggleSave && (
            <button
              type="button"
              onClick={() => void onToggleSave(item)}
              className={`glass-chip px-3 py-2 text-[0.65rem] tracking-[0.14em] uppercase ${
                isSaved ? 'text-[var(--sunset)]' : 'text-[var(--sea)]'
              }`}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
        <p className="mt-2.5 max-w-prose text-[0.925rem] leading-relaxed text-[var(--ink)] sm:mt-3">
          <span className="font-medium text-[var(--sea-deep)]">In short — </span>
          {item.gist}
        </p>
        {item.paragraph && item.paragraph !== item.gist && (
          <p className="mt-2.5 max-w-prose text-[0.925rem] leading-relaxed text-[var(--ink-muted)] sm:text-[0.975rem]">
            {item.paragraph}
          </p>
        )}
        <div className="mt-4 max-w-prose">
          <p className="text-[0.65rem] font-medium tracking-[0.16em] text-[var(--sea)] uppercase">
            What this is
          </p>
          <ul className="mt-2 space-y-1.5 text-[0.9rem] leading-relaxed text-[var(--ink-muted)]">
            <li>
              <span className="font-medium text-[var(--ink)]">Concept: </span>
              {w.concept}
            </li>
            <li>
              <span className="font-medium text-[var(--ink)]">Told: </span>
              {w.told}
            </li>
            <li>
              <span className="font-medium text-[var(--ink)]">Purpose: </span>
              {w.purpose}
            </li>
          </ul>
        </div>
        {item.important_points.length > 0 && (
          <div className="mt-4 max-w-prose">
            <p className="text-[0.65rem] font-medium tracking-[0.16em] text-[var(--sea)] uppercase">
              Important points
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.9rem] leading-relaxed text-[var(--ink-muted)]">
              {item.important_points.map((point) => (
                <li key={point.slice(0, 48)}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs tracking-wide text-[var(--ink-soft)] uppercase sm:mt-4">
          <span className="scope-pill">{scopeLabel(item.scope)}</span>
          <span className="opacity-70 normal-case tracking-normal break-words">
            {formatSources(item.sources)}
          </span>
        </div>
      </div>
    </article>
  )
}

type OpinionCardProps = {
  item: FullPaperOpinionItem
  index: number
  isSaved?: boolean
  onToggleSave?: (item: FullPaperOpinionItem) => Promise<void>
}

export function FullPaperOpinionCard({
  item,
  index,
  isSaved = false,
  onToggleSave,
}: OpinionCardProps) {
  return (
    <article
      className="story-row group border-b border-[var(--line)] py-5 last:border-b-0 sm:py-7"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg leading-snug break-words text-[var(--ink)] sm:text-xl md:text-2xl">
            {item.headline}
          </h3>
          {onToggleSave && (
            <button
              type="button"
              onClick={() => void onToggleSave(item)}
              className={`glass-chip px-3 py-2 text-[0.65rem] tracking-[0.14em] uppercase ${
                isSaved ? 'text-[var(--sunset)]' : 'text-[var(--sea)]'
              }`}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
        <p className="mt-2.5 max-w-prose text-[0.925rem] leading-relaxed text-[var(--ink)] sm:mt-3">
          <span className="font-medium text-[var(--sea-deep)]">In short — </span>
          {item.gist}
        </p>
        {item.points.length > 0 && (
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9rem] leading-relaxed text-[var(--ink-muted)]">
            {item.points.map((point) => (
              <li key={point.slice(0, 48)}>{point}</li>
            ))}
          </ul>
        )}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs tracking-wide text-[var(--ink-soft)] uppercase sm:mt-4">
          <span className="scope-pill">{scopeLabel(item.scope)}</span>
          <span className="opacity-70 normal-case tracking-normal break-words">
            {formatSources(item.sources)}
          </span>
        </div>
      </div>
    </article>
  )
}
