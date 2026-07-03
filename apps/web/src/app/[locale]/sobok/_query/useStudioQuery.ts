import type { GETV1ChatStudioResponse } from '@litomi/contracts'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export async function fetchChatStudio() {
  const url = '/api/v1/chat/studio'
  const { data } = await fetchAPIData<GETV1ChatStudioResponse>(url)
  return data
}

// 내 아티스트 프로필 — null이면 온보딩 전.
export default function useStudioQuery() {
  return useQuery({
    queryKey: QueryKeys.chatStudio,
    queryFn: fetchChatStudio,
    staleTime: 0,
  })
}
