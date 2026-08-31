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
}

export type PrimaryView = 'local' | 'coastal'
