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
    gcTime: 0,
  })
}

async function fetchMe(): Promise<ResponseApiMe | null> {
  const response = await fetch('/api/me')
  if (!response.ok) {
    if (response.status === 401) return null
    throw new Error('/api/me 요청을 실패했어요.')
  }
  return response.json()
}
