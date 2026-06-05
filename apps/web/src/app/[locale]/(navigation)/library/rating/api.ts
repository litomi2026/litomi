import type { DELETEV1LibraryRatingBody, DELETEV1LibraryRatingResponse } from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function deleteRatings(body: DELETEV1LibraryRatingBody) {
  const url = '/api/v1/library/rating'

  const { data } = await fetchAPIData<DELETEV1LibraryRatingResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
