import type { DELETEV1LibraryRatingBody, DELETEV1LibraryRatingResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deleteRatings(body: DELETEV1LibraryRatingBody) {
  const url = new URL('/api/v1/library/rating', NEXT_PUBLIC_API_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1LibraryRatingResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
