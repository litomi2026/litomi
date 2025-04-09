import { ResponseApiMe } from '@/app/api/me/route'
import { QueryKeys } from '@/constants/query'
import { useSuspenseQuery } from '@tanstack/react-query'

export default function useMeQuery() {
  return useSuspenseQuery({
    queryKey: QueryKeys.me,
    queryFn: fetchMe,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })
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
