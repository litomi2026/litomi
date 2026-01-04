import { useQuery } from '@tanstack/react-query'

import type { GETV1LibraryListResponse } from '@/backend/api/v1/library/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Options = {
  enabled?: boolean
}

export async function fetchLibraries() {
  const params = new URLSearchParams()
  params.set('scope', 'me')

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library?${params}`
  const { data } = await fetchWithErrorHandling<GETV1LibraryListResponse>(url, { credentials: 'include' })
  return data.libraries
}

export default function useLibrariesQuery({ enabled = true }: Options = {}) {
  const { data: me } = useMeQuery()

  return useQuery({
    queryKey: QueryKeys.libraries,
    queryFn: fetchLibraries,
    enabled: enabled && Boolean(me),
  })
}
