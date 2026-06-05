import type {
  DELETEV1BookmarkBody,
  DELETEV1BookmarkResponse,
  POSTV1BookmarkBody,
  POSTV1BookmarkResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export async function addBookmarks(body: POSTV1BookmarkBody) {
  const url = new URL('/api/v1/bookmark', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1BookmarkResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deleteBookmarks(body: DELETEV1BookmarkBody) {
  const url = new URL('/api/v1/bookmark', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1BookmarkResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
