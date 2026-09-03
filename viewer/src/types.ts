export type SourceRef = {
  paper: string
  edition: string
  page: number
  index: number
}

export type StoryItem = {
  rank: number
  headline: string
  blurb: string
  kind: string
  scope: string
  sources: SourceRef[]
}

export type LocalBucketKey =
  | 'mangaluru'
  | 'coastal_karnataka'
  | 'karnataka'
  | 'india'
  | 'international'
  | 'sports'

export type LocalBucket = {
  label: string
  candidate_count: number
  selected_count: number
  items: StoryItem[]
}

export type LocalTop5 = {
  date: string
  date_slug: string
  papers_scanned: Array<{
    paper: string
    edition: string
    path: string
    total_articles?: number
  }>
  buckets: Partial<Record<LocalBucketKey, LocalBucket>>
}

export type CoastalKatteItem = StoryItem & {
  source_bucket: string
  local_top_rank: number
  why_channel: string
}

export type CoastalKatteTop5 = {
  date: string
  date_slug: string
  channel: string
  source_local_top5: string
  candidate_count: number
  selected_count: number
  items: CoastalKatteItem[]
}

export type DateEntry = {
  date_slug: string
  date: string | null
  has_local_top5: boolean
  has_coastal_katte: boolean
  has_full_paper?: boolean
}

export type PrimaryView = 'local' | 'coastal' | 'full' | 'saved' | 'search'

export type SavedArticleOrigin =
  | 'local_top5'
  | 'coastal_katte'
  | 'full_paper_news'
  | 'full_paper_technology'
  | 'full_paper_opinion'

export type SavedArticle = {
  id: string
  date_slug: string
  date: string
  origin: SavedArticleOrigin
  headline: string
  summary: string
  kind: string
  scope: string
  sources: SourceRef[]
  saved_at: string
  rank?: number
  why_channel?: string
  source_bucket?: string
  local_top_rank?: number
  paragraph?: string
  what_this_is?: WhatThisIs
  important_points?: string[]
  points?: string[]
}

export type WhatThisIs = {
  concept: string
  told: string
  purpose: string
}

export type FullPaperNewsItem = {
  rank?: number
  headline: string
  gist: string
  paragraph: string
  what_this_is: WhatThisIs
  important_points: string[]
  kind: string
  scope: string
  sources: SourceRef[]
}

export type FullPaperOpinionItem = {
  headline: string
  gist: string
  points: string[]
  kind: string
  scope: string
  sources: SourceRef[]
}

export type FullPaperNewsBucketKey =
  | 'mangaluru'
  | 'coastal_karnataka'
  | 'karnataka'
  | 'india'
  | 'international'
  | 'sports'
  | 'lifestyle'
  | 'other'

export type FullPaperNewsBucket = {
  label: string
  item_count: number
  items: FullPaperNewsItem[]
}

export type FullPaper = {
  date: string
  date_slug: string
  papers_scanned: Array<{
    paper: string
    edition: string
    path: string
    total_articles?: number
  }>
  summary: {
    source_articles: number
    clusters: number
    news_count: number
    technology_candidate_count: number
    technology_top5_count: number
    technology_rest_count: number
    opinion_count: number
  }
  sections: {
    news: {
      label: string
      buckets: Partial<Record<FullPaperNewsBucketKey, FullPaperNewsBucket>>
    }
    technology: {
      label: string
      top5: {
        label: string
        candidate_count: number
        selected_count: number
        items: FullPaperNewsItem[]
      }
      rest: {
        label: string
        item_count: number
        items: FullPaperNewsItem[]
      }
    }
    opinion: {
      label: string
      item_count: number
      items: FullPaperOpinionItem[]
    }
  }
}

export type FullPaperSectionId = 'news' | 'technology' | 'opinion'

export type CatalogArticleOrigin =
  | 'local_top5'
  | 'coastal_katte'
  | 'full_paper_news'
  | 'full_paper_technology'
  | 'full_paper_opinion'

export type CatalogArticle = {
  id: string
  date_slug: string
  date: string
  origin: CatalogArticleOrigin
  headline: string
  gist: string
  kind: string
  scope: string
  sources: SourceRef[]
  sort_index: number
  bucket?: FullPaperNewsBucketKey | string
  technology_group?: 'top5' | 'rest'
  rank?: number
  paragraph?: string
  what_this_is?: WhatThisIs
  important_points?: string[]
  points?: string[]
  why_channel?: string
  source_bucket?: string
  local_top_rank?: number
}

export type FullPaperEdition = {
  date: string
  date_slug: string
  papers_scanned: FullPaper['papers_scanned']
  summary: FullPaper['summary']
  section_labels: {
    news: string
    technology: string
    technology_top5: string
    technology_rest: string
    opinion: string
  }
  has_full_paper: boolean
}
