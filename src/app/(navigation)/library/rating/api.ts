import type {
  DELETEV1LibraryRatingBody,
  DELETEV1LibraryRatingResponse,
} from '@/backend/api/v1/library/rating/DELETE'

import { env } from '@/env/client'
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
