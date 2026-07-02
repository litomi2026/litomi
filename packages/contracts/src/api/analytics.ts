export interface PageRanking {
  page: string
  activeUsers: number
}

export interface GETV1AnalyticsRealtimeResponse {
  totalActiveUsers: number
  pageRanking: PageRanking[]
  timestamp: string
}
