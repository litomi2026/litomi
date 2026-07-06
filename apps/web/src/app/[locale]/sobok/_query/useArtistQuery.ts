import type { GETV1ChatArtistResponse } from '@litomi/contracts'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useArtistQuery(handle: string) {
  return useQuery({
    queryKey: QueryKeys.chatArtist(handle),
    queryFn: async () => {
      const { data } = await fetchAPIData<GETV1ChatArtistResponse>(`/api/v1/chat/artist/${handle}`)
      return data
    },
    enabled: Boolean(handle),
    // Role/entitlement can change (subscribe/lapse) — keep it fresh across navigation
    // instead of the app-wide 10-min default.
    staleTime: 0,
  })
}
