import { useQuery } from '@tanstack/react-query'

import { GETLibraryResponse } from '@/backend/api/v1/library'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import useMeQuery from '@/query/useMeQuery'
import { handleResponseError } from '@/utils/react-query-error'

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
