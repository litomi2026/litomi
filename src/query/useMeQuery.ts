import { useSuspenseQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { GETMeResponse } from '@/app/api/me/route'
import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/lazy'

export default function useMeQuery() {
  const result = useSuspenseQuery({
    queryKey: QueryKeys.me,
    queryFn: fetchMe,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })

  const userId = result.data?.id

  useEffect(() => {
    if (userId) {
      amplitude.setUserId(userId)
    }
  }, [userId])

  return result
}

async function fetchMe(): Promise<GETMeResponse | null> {
  const response = await fetch('/api/me')

  if ([401, 404].includes(response.status)) {
    return null
  }

  if (!response.ok) {
    throw new Error('GET /api/me 요청이 실패했어요.')
  }

  return response.json()
}
