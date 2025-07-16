import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { GETMeResponse } from '@/app/api/me/route'
import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/lazy'
import { handleResponseError } from '@/utils/react-query-error'

export async function fetchMe() {
  const response = await fetch('/api/me')
  return handleResponseError<GETMeResponse>(response)
}

let hasMeQueryFetched = false

export function resetMeQuery() {
  hasMeQueryFetched = false
}

export default function useMeQuery() {
  const result = useQuery({
    queryKey: QueryKeys.me,
    queryFn: fetchMe,
    enabled: !hasMeQueryFetched,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })

  const userId = result.data?.id
  const isFetched = result.isFetched

  useEffect(() => {
    if (userId) {
      amplitude.setUserId(userId)
      hasMeQueryFetched = true
    }
  }, [userId])

  useEffect(() => {
    if (isFetched) {
      hasMeQueryFetched = true
    }
  }, [isFetched])

  return result
}
