import { useState } from 'react'
import type {
  FullPaper,
  FullPaperNewsItem,
  FullPaperNewsBucketKey,
  FullPaperOpinionItem,
  FullPaperSectionId,
} from '../types'
import { FullPaperNewsCard, FullPaperOpinionCard } from './FullPaperCard'

const NEWS_BUCKETS: { key: FullPaperNewsBucketKey; short: string }[] = [
  { key: 'mangaluru', short: 'Mangaluru' },
  { key: 'coastal_karnataka', short: 'Coastal Karnataka' },
  { key: 'karnataka', short: 'Karnataka' },
  { key: 'india', short: 'India' },
  { key: 'international', short: 'International' },
  { key: 'sports', short: 'Sports' },
  { key: 'lifestyle', short: 'Lifestyle' },
  { key: 'other', short: 'Other' },
]

const SECTIONS: { id: FullPaperSectionId; label: string }[] = [
  { id: 'news', label: 'Complete news' },
  { id: 'technology', label: 'Technology' },
  { id: 'opinion', label: 'Opinion & Explainers' },
]

type FullPaperViewProps = {
  data: FullPaper
  isSaved: (articleId: string) => boolean
  articleIdForNews: (item: FullPaperNewsItem, origin: 'news' | 'technology') => string
  articleIdForOpinion: (item: FullPaperOpinionItem) => string
  onToggleNewsSave: (
    item: FullPaperNewsItem,
    origin: 'news' | 'technology',
  ) => Promise<void>
  onToggleOpinionSave: (item: FullPaperOpinionItem) => Promise<void>
}

export function FullPaperView({
  data,
  isSaved,
  articleIdForNews,
  articleIdForOpinion,
  onToggleNewsSave,
  onToggleOpinionSave,
}: FullPaperViewProps) {
  const [section, setSection] = useState<FullPaperSectionId>('news')
  const [bucket, setBucket] = useState<FullPaperNewsBucketKey>('mangaluru')
  const current = data.sections.news.buckets[bucket]
  const newsItems = current?.items ?? []

  return (
    <div className="view-panel" key={data.date_slug}>
      <header className="mb-6 sm:mb-8">
        <p className="text-[0.7rem] font-medium tracking-[0.2em] text-[var(--sea)] uppercase">
          Full paper
        </p>
        <h2 className="mt-2 font-display text-2xl text-[var(--ink)] sm:text-3xl md:text-4xl">
          {data.date}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          {data.summary.source_articles} articles → {data.summary.clusters}{' '}
          clusters ·{' '}
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
        className="glass-nav bucket-scroll mb-5 sm:mb-6"
        role="tablist"
        aria-label="Full paper sections"
      >
        {SECTIONS.map(({ id, label }) => {
          const active = section === id
          const count =
            id === 'news'
              ? data.summary.news_count
              : id === 'technology'
                ? data.summary.technology_candidate_count
                : data.summary.opinion_count
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              data-active={active ? 'true' : 'false'}
              className={`glass-tab px-3.5 py-2.5 text-sm transition-colors ${
                active
                  ? 'text-[var(--ink)]'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
              onClick={() => setSection(id)}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-60">({count})</span>
              {active && (
                <span className="absolute inset-x-2.5 bottom-1.5 h-0.5 rounded-full bg-[var(--sea)]" />
              )}
            </button>
          )
        })}
      </div>

      {section === 'news' && (
        <div role="tabpanel">
          <div
            className="glass-nav bucket-scroll mb-5 sm:mb-6"
            role="tablist"
            aria-label="Complete news buckets"
          >
            {NEWS_BUCKETS.map(({ key, short }) => {
              const count = data.sections.news.buckets[key]?.item_count ?? 0
              const active = bucket === key
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-active={active ? 'true' : 'false'}
                  className={`glass-tab px-3.5 py-2.5 text-sm transition-colors ${
                    active
                      ? 'text-[var(--ink)]'
                      : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                  onClick={() => setBucket(key)}
                >
                  {short}
                  <span className="ml-1.5 text-xs opacity-60">({count})</span>
                  {active && (
                    <span className="absolute inset-x-2.5 bottom-1.5 h-0.5 rounded-full bg-[var(--lagoon)]" />
                  )}
                </button>
              )
            })}
          </div>
          {newsItems.length === 0 ? (
            <p className="py-10 text-[var(--ink-muted)] italic sm:py-12">
              No stories in this bucket today.
            </p>
          ) : (
            newsItems.map((item, i) => (
              <FullPaperNewsCard
                key={`${item.headline}-${item.sources[0]?.page ?? i}`}
                item={item}
                index={i}
                isSaved={isSaved(articleIdForNews(item, 'news'))}
                onToggleSave={(target) => onToggleNewsSave(target, 'news')}
              />
            ))
          )}
        </div>
      )}

      {section === 'technology' && (
        <div role="tabpanel">
          <p className="mb-2 text-xs tracking-wide text-[var(--ink-soft)] uppercase">
            {data.sections.technology.top5.label} ·{' '}
            {data.sections.technology.top5.candidate_count} candidates →{' '}
            {data.sections.technology.top5.selected_count} selected
          </p>
          {data.sections.technology.top5.items.length === 0 ? (
            <p className="py-8 text-[var(--ink-muted)] italic">
              No technology stories in today&apos;s digests.
            </p>
          ) : (
            data.sections.technology.top5.items.map((item, i) => (
              <FullPaperNewsCard
                key={`tech-top-${item.rank ?? i}`}
                item={item}
                index={i}
                isSaved={isSaved(articleIdForNews(item, 'technology'))}
                onToggleSave={(target) => onToggleNewsSave(target, 'technology')}
              />
            ))
          )}
          {data.sections.technology.rest.items.length > 0 && (
            <>
              <h3 className="mt-8 font-display text-xl text-[var(--ink)] sm:text-2xl">
                {data.sections.technology.rest.label}
              </h3>
              {data.sections.technology.rest.items.map((item, i) => (
                <FullPaperNewsCard
                  key={`tech-rest-${item.headline}`}
                  item={item}
                  index={i}
                  isSaved={isSaved(articleIdForNews(item, 'technology'))}
                  onToggleSave={(target) => onToggleNewsSave(target, 'technology')}
                />
              ))}
            </>
          )}
        </div>
      )}

      {section === 'opinion' && (
        <div role="tabpanel">
          <p className="mb-2 text-xs tracking-wide text-[var(--ink-soft)] uppercase">
            {data.sections.opinion.label} · {data.sections.opinion.item_count}{' '}
            pieces
          </p>
          {data.sections.opinion.items.length === 0 ? (
            <p className="py-10 text-[var(--ink-muted)] italic sm:py-12">
              No editorials or explainers in today&apos;s digests.
            </p>
          ) : (
            data.sections.opinion.items.map((item, i) => (
              <FullPaperOpinionCard
                key={`${item.headline}-${i}`}
                item={item}
                index={i}
                isSaved={isSaved(articleIdForOpinion(item))}
                onToggleSave={onToggleOpinionSave}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
