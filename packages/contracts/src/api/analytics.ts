export interface PageRanking {
  page: string
  pageViews: number
}

export interface GETV1AnalyticsRealtimeResponse {
  totalActiveUsers: number
  pageRanking: PageRanking[]
  timestamp: string
}
