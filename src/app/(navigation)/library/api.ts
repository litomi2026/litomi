import type { DELETEV1LibraryIdResponse } from '@/backend/api/v1/library/[id]/DELETE'
import type { PATCHV1LibraryIdBody, PATCHV1LibraryIdResponse } from '@/backend/api/v1/library/[id]/PATCH'
import type {
  DELETEV1LibraryItemBody,
  DELETEV1LibraryItemResponse,
  POSTV1LibraryItemAddBody,
  POSTV1LibraryItemAddResponse,
  POSTV1LibraryItemCopyBody,
  POSTV1LibraryItemCopyResponse,
  POSTV1LibraryItemMoveBody,
  POSTV1LibraryItemMoveResponse,
} from '@/backend/api/v1/library/item'

import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function addMangaToLibraries(body: POSTV1LibraryItemAddBody) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/item`

  const { data } = await fetchWithErrorHandling<POSTV1LibraryItemAddResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function bulkCopyToLibrary(body: POSTV1LibraryItemCopyBody) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/item/copy`

  const { data } = await fetchWithErrorHandling<POSTV1LibraryItemCopyResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function bulkMoveToLibrary(body: POSTV1LibraryItemMoveBody) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/item/move`

  const { data } = await fetchWithErrorHandling<POSTV1LibraryItemMoveResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function bulkRemoveFromLibrary(body: DELETEV1LibraryItemBody) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/item`

  const { data } = await fetchWithErrorHandling<DELETEV1LibraryItemResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deleteLibrary(libraryId: number) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/${libraryId}`

  const { data } = await fetchWithErrorHandling<DELETEV1LibraryIdResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function updateLibrary(libraryId: number, body: PATCHV1LibraryIdBody) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/${libraryId}`

  const { data } = await fetchWithErrorHandling<PATCHV1LibraryIdResponse>(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
