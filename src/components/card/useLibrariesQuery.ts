import { useQuery } from '@tanstack/react-query'

import { GETLibraryResponse } from '@/app/api/library/route'
import { QueryKeys } from '@/constants/query'
import useMeQuery from '@/query/useMeQuery'
import { handleResponseError } from '@/utils/react-query-error'

export async function fetchLibraries() {
  const response = await fetch('/api/library')
  return handleResponseError<GETLibraryResponse>(response)
}

export default function useLibrariesQuery() {
  const { data: me } = useMeQuery()

  return useQuery({
    queryKey: QueryKeys.libraries,
    queryFn: fetchLibraries,
    enabled: Boolean(me),
  })
}
