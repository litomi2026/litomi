'use client'

import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { getLocalReadingHistory } from '@/utils/reading-history-index'

export type LocalReadingHistorySummary = {
  historyCount: number
}

type Options = {
  enabled?: boolean
}

export default function useLocalReadingHistorySummaryQuery({ enabled = true }: Options = {}) {
  return useQuery({
    queryKey: QueryKeys.localReadingHistorySummary,
    queryFn: () => ({ historyCount: Object.keys(getLocalReadingHistory()).length }),
    enabled,
  })
}
