import type {
  DELETEV1LibraryRatingBody,
  DELETEV1LibraryRatingResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/env/client'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deleteRatings(body: DELETEV1LibraryRatingBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library/rating`

  const { data } = await fetchWithErrorHandling<DELETEV1LibraryRatingResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
