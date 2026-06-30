import type { GETV1ChatThreadsResponse } from '@litomi/contracts'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export async function fetchChatThreads() {
  const url = '/api/v1/chat/threads'
  const { data } = await fetchAPIData<GETV1ChatThreadsResponse>(url)
  return data
}

export default function useChatThreadsQuery() {
  return useQuery({
    queryKey: QueryKeys.chatThreads,
    queryFn: fetchChatThreads,
    // Realtime chat list: refetch on remount/focus. ChatRealtime also invalidates this on
    // incoming broadcasts, and markRead invalidates it on read — so the unread badge stays live.
    staleTime: 0,
  })
}
