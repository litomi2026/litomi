import { useQuery } from '@tanstack/react-query'

import type { GETLibraryResponse } from '@/backend/api/v1/library/get'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Options = {
  enabled?: boolean
}

export async function fetchLibraries() {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETLibraryResponse>(response)
}

export default function useLibrariesQuery({ enabled = true }: Options = {}) {
  const { data: me } = useMeQuery()

  return useQuery({
    queryKey: QueryKeys.libraries,
    queryFn: fetchLibraries,
    enabled: enabled && Boolean(me),
  })
}
