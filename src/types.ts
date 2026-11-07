export interface PageRecord {
  id?: number
  url: string
  title: string
  date: number
  pageId: string
  isBookmarked: boolean
  indexVersion?: number
  contentHash?: string
  titleHash?: string
  source?: 'page' | 'history' | 'bookmark' | 'import'
  truncated?: boolean
}
export interface ContentRecord {
  pid: number
  content: string
  contentWords: string[]
  titleWords: string[]
  urlWords?: string[]
}
export interface PageInput {
  mergeContent?: boolean
  url: string
  title: string
  content?: string
  date?: number
  pageId?: string
  isBookmarked?: boolean
  source?: PageRecord['source']
  truncated?: boolean
}
export interface SearchRequest {
  query: string
  field?: 'all' | 'title' | 'content' | 'url'
  source?: 'all' | 'bookmarks' | 'tabs'
  sort?: 'relevance' | 'recent' | 'oldest'
  fuzzy?: boolean
  limit?: number
  offset?: number
}
export interface SearchResult extends PageRecord {
  score: number
  snippet: string
  matched: string[]
  tabId?: number
  windowId?: number
}
export interface SearchResponse {
  results: SearchResult[]
  total: number
  elapsed: number
  indexing: number
  limited?: boolean
  partial?: boolean
}
