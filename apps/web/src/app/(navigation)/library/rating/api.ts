import type { DELETEV1LibraryRatingBody, DELETEV1LibraryRatingResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deleteRatings(body: DELETEV1LibraryRatingBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library/rating`

  const { data } = await fetchAPIData<DELETEV1LibraryRatingResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
