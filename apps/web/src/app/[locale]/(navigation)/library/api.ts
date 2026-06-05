import type {
  DELETEV1LibraryIdResponse,
  DELETEV1LibraryItemBody,
  DELETEV1LibraryItemResponse,
  PATCHV1LibraryIdBody,
  PATCHV1LibraryIdResponse,
  POSTV1LibraryItemAddBody,
  POSTV1LibraryItemAddResponse,
  POSTV1LibraryItemCopyBody,
  POSTV1LibraryItemCopyResponse,
  POSTV1LibraryItemMoveBody,
  POSTV1LibraryItemMoveResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export async function addMangaToLibraries(body: POSTV1LibraryItemAddBody) {
  const url = new URL('/api/v1/library/item', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1LibraryItemAddResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function bulkCopyToLibrary(body: POSTV1LibraryItemCopyBody) {
  const url = new URL('/api/v1/library/item/copy', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1LibraryItemCopyResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function bulkMoveToLibrary(body: POSTV1LibraryItemMoveBody) {
  const url = new URL('/api/v1/library/item/move', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1LibraryItemMoveResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function bulkRemoveFromLibrary(body: DELETEV1LibraryItemBody) {
  const url = new URL('/api/v1/library/item', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1LibraryItemResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deleteLibrary(libraryId: number) {
  const url = new URL(`/api/v1/library/${libraryId}`, NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1LibraryIdResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function updateLibrary(libraryId: number, body: PATCHV1LibraryIdBody) {
  const url = new URL(`/api/v1/library/${libraryId}`, NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<PATCHV1LibraryIdResponse>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
