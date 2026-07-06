import type { GETV1ChatMessagesResponse } from '@litomi/contracts'
import { useInfiniteQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

export default function useChatMessageQuery(handle: string, options?: { refetchInterval?: number }) {
  return useInfiniteQuery({
    queryKey: QueryKeys.chatMessages(handle),
    queryFn: async ({ pageParam }) => {
      const searchParams = buildSearchParams({ before: pageParam })
      const url = `/api/v1/chat/artist/${handle}/message?${searchParams}`
      const { data } = await fetchAPIData<GETV1ChatMessagesResponse>(url)
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(handle),
    refetchInterval: options?.refetchInterval,
    staleTime: 0,
  })
}
