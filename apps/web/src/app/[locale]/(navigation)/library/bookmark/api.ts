import type {
  DELETEV1BookmarkBody,
  DELETEV1BookmarkResponse,
  POSTV1BookmarkBody,
  POSTV1BookmarkResponse,
} from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function addBookmarks(body: POSTV1BookmarkBody) {
  const url = '/api/v1/bookmark'

  const { data } = await fetchAPIData<POSTV1BookmarkResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deleteBookmarks(body: DELETEV1BookmarkBody) {
  const url = '/api/v1/bookmark'

  const { data } = await fetchAPIData<DELETEV1BookmarkResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
