import type { GETV1ChatRepliesResponse } from '@litomi/contracts'
import { useInfiniteQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

type Params = {
  handle: string
  messageId: string
  before?: string
}

export async function fetchChatReplies({ handle, messageId, before }: Params) {
  const searchParams = buildSearchParams({ before })
  const url = `/api/v1/chat/artist/${handle}/message/${messageId}/reply?${searchParams}`
  const { data } = await fetchAPIData<GETV1ChatRepliesResponse>(url)
  return data
}

export default function useMessageReplyQuery(handle: string, messageId: string) {
  return useInfiniteQuery({
    queryKey: QueryKeys.chatReplies(handle, messageId),
    queryFn: ({ pageParam }) =>
      fetchChatReplies({
        handle,
        messageId,
        before: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(handle) && Boolean(messageId),
    // Realtime reply room: refetch on remount/focus rather than serving a 10-min-stale cache.
    staleTime: 0,
  })
}
