import type { GETV1ChatMessagesResponse } from '@litomi/contracts'
import { useInfiniteQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

type Params = {
  handle: string
  before?: string
}

export async function fetchChatMessages({ handle, before }: Params) {
  const searchParams = buildSearchParams({ before })
  const url = `/api/v1/chat/artist/${handle}/message?${searchParams}`
  const { data } = await fetchAPIData<GETV1ChatMessagesResponse>(url)
  return data
}

export default function useChatMessageQuery(handle: string, options?: { refetchInterval?: number; enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: QueryKeys.chatMessages(handle),
    queryFn: ({ pageParam }) =>
      fetchChatMessages({
        handle,
        before: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(handle) && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 0,
  })
}
