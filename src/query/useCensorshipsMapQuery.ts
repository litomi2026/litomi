import { useQuery } from '@tanstack/react-query'

import { CensorshipItem, GETCensorshipsResponse } from '@/app/api/censorships/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

export async function fetchCensorshipsMap() {
  const response = await fetch('/api/censorships')
  const result = await handleResponseError<GETCensorshipsResponse>(response)

  if (result.censorships.length === 0) {
    return new Map<string, CensorshipItem>()
  }

  const lookup = new Map<string, CensorshipItem>()

  for (const censorship of result.censorships) {
    const key = `${censorship.key}:${censorship.value.toLowerCase()}`
    lookup.set(key, censorship)
  }

  return lookup
}

export default function useCensorshipsMapQuery() {
  const { data: me } = useMeQuery()
  const userId = me?.id

  return useQuery({
    queryKey: QueryKeys.censorships,
    queryFn: fetchCensorshipsMap,
    enabled: Boolean(userId),
  })
}
