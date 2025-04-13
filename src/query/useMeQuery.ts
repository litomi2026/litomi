import { ResponseApiMe } from '@/app/api/me/route'
import { QueryKeys } from '@/constants/query'
import * as amplitude from '@amplitude/analytics-browser'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

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
      amplitude.setUserId(String(userId))
    }
  }, [userId])

  return result
}

async function fetchMe(): Promise<ResponseApiMe | null> {
  const response = await fetch('/api/me')
  if (!response.ok) {
    if (response.status === 401) return null
    if (response.status === 404) return null
    throw new Error('GET /api/me 요청이 실패했어요.')
  }
  return response.json()
}
