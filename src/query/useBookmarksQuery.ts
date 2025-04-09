import { ResponseApiBookmark } from '@/app/api/bookmarks/route'
import { QueryKeys } from '@/constants/query'
import { useSuspenseQuery } from '@tanstack/react-query'

import useMeQuery from './useMeQuery'

export default function useBookmarksQuery() {
  const { data: me } = useMeQuery()

  return useSuspenseQuery({
    queryKey: QueryKeys.bookmarks,
    queryFn: me ? fetchBookmarks : () => null,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })
}

async function fetchBookmarks(): Promise<Set<number> | null> {
  const response = await fetch('/api/bookmarks')
  if (!response.ok) {
    if (response.status === 401) return null
    if (response.status === 404) return null
    throw new Error('GET /api/bookmarks 요청이 실패했어요')
  }
  return new Set(((await response.json()) as ResponseApiBookmark).mangaIds)
}
