import { useState } from 'react'
import type { LocalBucketKey, LocalTop5 } from '../types'
import { StoryItemRow } from './StoryItem'

const BUCKETS: { key: LocalBucketKey; short: string }[] = [
  { key: 'mangaluru', short: 'Mangaluru' },
  { key: 'coastal_karnataka', short: 'Coastal Karnataka' },
  { key: 'karnataka', short: 'Karnataka' },
]

type LocalTop5ViewProps = {
  data: LocalTop5
}

export function LocalTop5View({ data }: LocalTop5ViewProps) {
  const [bucket, setBucket] = useState<LocalBucketKey>('mangaluru')
  const current = data.buckets[bucket]
  const items = current?.items ?? []

  return (
    <div className="view-panel" key={data.date_slug}>
      <header className="mb-8">
        <p className="text-[0.7rem] font-medium tracking-[0.2em] text-[var(--sea)] uppercase">
          Local Top 5
        </p>
        <h2 className="mt-2 font-display text-3xl text-[var(--ink)] sm:text-4xl">
          {data.date}
        </h2>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Papers scanned:{' '}
          {data.papers_scanned
            .map((p) =>
              p.total_articles != null
                ? `${p.paper} ${p.edition} (${p.total_articles})`
                : `${p.paper} ${p.edition}`,
            )
            .join(' · ') || '—'}
        </p>
      </header>

      <div
        className="mb-6 flex flex-wrap gap-2 border-b border-[var(--line)] pb-1"
        role="tablist"
        aria-label="Local Top 5 buckets"
      >
        {BUCKETS.map(({ key, short }) => {
          const count = data.buckets[key]?.selected_count ?? 0
          const active = bucket === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`bucket-tab relative px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'font-medium text-[var(--ink)]'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
              onClick={() => setBucket(key)}
            >
              {short}
              <span className="ml-1.5 text-xs opacity-60">({count})</span>
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-[var(--sea)]" />
              )}
            </button>
          )
        })}
      </div>

      <div role="tabpanel">
        <p className="mb-2 text-xs tracking-wide text-[var(--ink-soft)] uppercase">
          {current?.label ?? 'Top 5'} · {current?.candidate_count ?? 0} candidates →{' '}
          {current?.selected_count ?? 0} selected
        </p>
        {items.length === 0 ? (
          <p className="py-12 text-[var(--ink-muted)] italic">
            No local stories in today&apos;s digests for this bucket.
          </p>
        ) : (
          <div key={bucket}>
            {items.map((item, i) => (
              <StoryItemRow key={`${bucket}-${item.rank}`} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
