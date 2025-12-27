import { useQuery } from '@tanstack/react-query'

import type { GETV1LibrarySummaryResponse } from '@/backend/api/v1/library/summary'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Options = {
  userId: number | null
}

export async function fetchLibrarySummary() {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/summary`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETV1LibrarySummaryResponse>(response)
}

export default function useLibrarySummaryQuery({ userId }: Options) {
  return useQuery({
    queryKey: QueryKeys.librarySummary(userId),
    queryFn: fetchLibrarySummary,
    enabled: userId != null,
  })
}
