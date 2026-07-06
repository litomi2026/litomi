import type { GETV1ChatThreadsResponse } from '@litomi/contracts'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useChatThreadsQuery() {
  return useQuery({
    queryKey: QueryKeys.chatThreads,
    queryFn: async () => {
      const { data } = await fetchAPIData<GETV1ChatThreadsResponse>('/api/v1/chat/threads')
      return data
    },
    // Realtime chat list: refetch on remount/focus. ChatRealtime also invalidates this on
    // incoming broadcasts, and markRead invalidates it on read — so the unread badge stays live.
    staleTime: 0,
  })
}
