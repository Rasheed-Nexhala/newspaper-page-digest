import type { User } from 'firebase/auth'
import type { SavedArticle } from '../types'

type SavedArticlesViewProps = {
  user: User | null
  authLoading: boolean
  authError: string | null
  items: SavedArticle[]
  loading: boolean
  error: string | null
  onSignIn: () => Promise<unknown>
  onSignOut: () => Promise<void>
  onRemove: (item: SavedArticle) => Promise<void>
}

function sourceText(item: SavedArticle): string {
  if (!item.sources.length) return 'No source listed'
  return item.sources
    .map((source) => `${source.paper} ${source.edition} p.${source.page}`)
    .join(' · ')
}

function prettyOrigin(origin: SavedArticle['origin']): string {
  return origin.replaceAll('_', ' ')
}

export function SavedArticlesView({
  user,
  authLoading,
  authError,
  items,
  loading,
  error,
  onSignIn,
  onSignOut,
  onRemove,
}: SavedArticlesViewProps) {
  return (
    <div className="view-panel">
      <header className="mb-6 sm:mb-8">
        <p className="text-[0.7rem] font-medium tracking-[0.2em] text-[var(--lagoon)] uppercase">
          Saved
        </p>
        <h2 className="mt-2 font-display text-2xl text-[var(--ink)] sm:text-3xl md:text-4xl">
          Read Later
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          Save stories from any date and revisit them in one place.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white/55 p-3.5">
        <div className="text-sm text-[var(--ink-muted)]">
          {user ? `Signed in as ${user.email ?? user.uid}` : 'Not signed in'}
        </div>
        {user ? (
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="glass-chip px-3 py-2 text-xs tracking-[0.14em] text-[var(--ink-soft)] uppercase"
          >
            Sign out
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onSignIn()}
            className="glass-chip px-3 py-2 text-xs tracking-[0.14em] text-[var(--sea)] uppercase"
            disabled={authLoading}
          >
            {authLoading ? 'Signing in…' : 'Sign in with Google'}
          </button>
        )}
      </div>

      {authError && (
        <p className="mb-3 text-sm text-[var(--sunset)]" role="alert">
          {authError}
        </p>
      )}

      {!user && !authLoading && (
        <p className="py-8 text-[var(--ink-muted)] italic">
          Sign in to view your saved articles.
        </p>
      )}

      {user && loading && (
        <p className="py-8 text-[var(--ink-muted)]">Loading saved articles…</p>
      )}

      {user && error && (
        <p className="py-4 text-sm text-[var(--sunset)]" role="alert">
          {error}
        </p>
      )}

      {user && !loading && !error && items.length === 0 && (
        <p className="py-10 text-[var(--ink-muted)] italic sm:py-12">
          No saved stories yet. Tap Save on any story to add it here.
        </p>
      )}

      {user &&
        !loading &&
        !error &&
        items.map((item, index) => (
          <article
            key={item.id}
            className="story-row border-b border-[var(--line)] py-5 last:border-b-0 sm:py-7"
            style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg leading-snug break-words text-[var(--ink)] sm:text-xl md:text-2xl">
                {item.headline}
              </h3>
              <button
                type="button"
                onClick={() => void onRemove(item)}
                className="glass-chip px-3 py-2 text-xs tracking-[0.14em] text-[var(--sunset)] uppercase"
              >
                Remove
              </button>
            </div>
            <p className="mt-2.5 max-w-prose text-[0.925rem] leading-relaxed text-[var(--ink-muted)] sm:text-[0.975rem]">
              {item.summary}
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs tracking-wide text-[var(--ink-soft)] uppercase">
              <span className="scope-pill">{item.scope.replaceAll('_', ' ')}</span>
              <span>{prettyOrigin(item.origin)}</span>
              <span className="opacity-70 normal-case tracking-normal break-words">
                {item.date} · {sourceText(item)}
              </span>
            </div>
          </article>
        ))}
    </div>
  )
}
