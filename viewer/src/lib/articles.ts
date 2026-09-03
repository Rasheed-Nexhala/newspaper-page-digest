import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  CatalogArticle,
  CoastalKatteItem,
  FullPaper,
  FullPaperEdition,
  FullPaperNewsBucket,
  FullPaperNewsBucketKey,
  FullPaperNewsItem,
  FullPaperOpinionItem,
  SavedArticle,
} from '../types'
import { db } from './firebase'

const NEWS_BUCKET_KEYS: FullPaperNewsBucketKey[] = [
  'mangaluru',
  'coastal_karnataka',
  'karnataka',
  'india',
  'international',
  'sports',
  'lifestyle',
  'other',
]

const BUCKET_LABELS: Record<FullPaperNewsBucketKey, string> = {
  mangaluru: 'Mangaluru',
  coastal_karnataka: 'Coastal Karnataka',
  karnataka: 'Karnataka',
  india: 'India',
  international: 'International',
  sports: 'Sports',
  lifestyle: 'Lifestyle',
  other: 'Other',
}

function asCatalogArticle(snap: QueryDocumentSnapshot): CatalogArticle {
  const data = snap.data() as Omit<CatalogArticle, 'id'>
  return { ...data, id: snap.id }
}

function toNewsItem(article: CatalogArticle): FullPaperNewsItem {
  return {
    rank: article.rank,
    headline: article.headline,
    gist: article.gist,
    paragraph: article.paragraph ?? article.gist,
    what_this_is: article.what_this_is ?? {
      concept: article.headline,
      told: article.gist,
      purpose: '',
    },
    important_points: article.important_points ?? [],
    kind: article.kind,
    scope: article.scope,
    sources: article.sources,
  }
}

function toOpinionItem(article: CatalogArticle): FullPaperOpinionItem {
  return {
    headline: article.headline,
    gist: article.gist,
    points: article.points ?? [],
    kind: article.kind,
    scope: article.scope,
    sources: article.sources,
  }
}

export function assembleFullPaper(
  edition: FullPaperEdition,
  articles: CatalogArticle[],
): FullPaper {
  const sorted = [...articles].sort((a, b) => a.sort_index - b.sort_index)
  const newsBuckets: Partial<Record<FullPaperNewsBucketKey, FullPaperNewsBucket>> = {}

  for (const key of NEWS_BUCKET_KEYS) {
    const items = sorted
      .filter((a) => a.origin === 'full_paper_news' && a.bucket === key)
      .map(toNewsItem)
    if (items.length === 0) continue
    newsBuckets[key] = {
      label: BUCKET_LABELS[key],
      item_count: items.length,
      items,
    }
  }

  const techTop = sorted
    .filter((a) => a.origin === 'full_paper_technology' && a.technology_group === 'top5')
    .map(toNewsItem)
  const techRest = sorted
    .filter((a) => a.origin === 'full_paper_technology' && a.technology_group === 'rest')
    .map(toNewsItem)
  const opinion = sorted
    .filter((a) => a.origin === 'full_paper_opinion')
    .map(toOpinionItem)

  const labels = edition.section_labels

  return {
    date: edition.date,
    date_slug: edition.date_slug,
    papers_scanned: edition.papers_scanned,
    summary: edition.summary,
    sections: {
      news: {
        label: labels.news,
        buckets: newsBuckets,
      },
      technology: {
        label: labels.technology,
        top5: {
          label: labels.technology_top5,
          candidate_count: edition.summary.technology_candidate_count,
          selected_count: techTop.length,
          items: techTop,
        },
        rest: {
          label: labels.technology_rest,
          item_count: techRest.length,
          items: techRest,
        },
      },
      opinion: {
        label: labels.opinion,
        item_count: opinion.length,
        items: opinion,
      },
    },
  }
}

export async function fetchFullPaperEdition(
  dateSlug: string,
): Promise<FullPaperEdition | null> {
  const snap = await getDoc(doc(db, 'editions', dateSlug))
  if (!snap.exists()) return null
  return snap.data() as FullPaperEdition
}

export async function fetchCatalogArticlesForDate(
  dateSlug: string,
): Promise<CatalogArticle[]> {
  const q = query(collection(db, 'articles'), where('date_slug', '==', dateSlug))
  const snap = await getDocs(q)
  return snap.docs.map(asCatalogArticle)
}

let allArticlesCache: Promise<CatalogArticle[]> | null = null

export function fetchAllCatalogArticles(
  force = false,
): Promise<CatalogArticle[]> {
  if (!force && allArticlesCache) return allArticlesCache
  allArticlesCache = getDocs(collection(db, 'articles')).then((snap) =>
    snap.docs.map(asCatalogArticle),
  )
  return allArticlesCache
}

export async function fetchFullPaper(dateSlug: string): Promise<FullPaper> {
  const [edition, articles] = await Promise.all([
    fetchFullPaperEdition(dateSlug),
    fetchCatalogArticlesForDate(dateSlug),
  ])
  if (!edition) {
    throw new Error(`No Full Paper edition in Firestore for ${dateSlug}`)
  }
  return assembleFullPaper(edition, articles)
}

export function catalogToSavedArticle(article: CatalogArticle): SavedArticle {
  return {
    id: article.id,
    date_slug: article.date_slug,
    date: article.date,
    origin: article.origin,
    headline: article.headline,
    summary: article.gist,
    kind: article.kind,
    scope: article.scope,
    sources: article.sources,
    saved_at: '',
    rank: article.rank,
    paragraph: article.paragraph,
    what_this_is: article.what_this_is,
    important_points: article.important_points,
    points: article.points,
    why_channel: article.why_channel,
    source_bucket: article.source_bucket,
    local_top_rank: article.local_top_rank,
  }
}

export function catalogToNewsItem(article: CatalogArticle): FullPaperNewsItem {
  return toNewsItem(article)
}

export function catalogToOpinionItem(article: CatalogArticle): FullPaperOpinionItem {
  return toOpinionItem(article)
}

export function catalogToStoryItem(article: CatalogArticle): CoastalKatteItem {
  return {
    rank: article.rank ?? 0,
    headline: article.headline,
    blurb: article.gist,
    kind: article.kind,
    scope: article.scope,
    sources: article.sources,
    source_bucket: article.source_bucket ?? '',
    local_top_rank: article.local_top_rank ?? article.rank ?? 0,
    why_channel: article.why_channel ?? '',
  }
}

export function isTopStoryOrigin(
  origin: CatalogArticle['origin'],
): origin is 'local_top5' | 'coastal_katte' {
  return origin === 'local_top5' || origin === 'coastal_katte'
}

export function catalogArticleMatches(
  article: CatalogArticle,
  rawQuery: string,
): boolean {
  const needle = rawQuery.trim().toLowerCase()
  if (needle.length < 2) return false
  const haystacks = [
    article.headline,
    article.gist,
    article.paragraph ?? '',
    article.scope.replaceAll('_', ' '),
    article.why_channel ?? '',
    article.source_bucket?.replaceAll('_', ' ') ?? '',
    ...(article.important_points ?? []),
    ...(article.points ?? []),
    ...(article.sources ?? []).flatMap((s) => [s.paper, s.edition]),
  ]
  return haystacks.some((text) => text.toLowerCase().includes(needle))
}
