import type { GETV1LibraryListResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

type Options = {
  enabled?: boolean
}

export async function fetchLibraries() {
  const params = new URLSearchParams()
  params.set('scope', 'me')

  const url = new URL('/api/v1/library', NEXT_PUBLIC_APP_ORIGIN)
  url.search = params.toString()
  const { data } = await fetchAPIData<GETV1LibraryListResponse>(url)
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
