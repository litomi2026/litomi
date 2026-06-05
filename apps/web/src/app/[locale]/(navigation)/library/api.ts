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

import { fetchAPIData } from '@/utils/api-request'

export async function addMangaToLibraries(body: POSTV1LibraryItemAddBody) {
  const url = '/api/v1/library/item'

  const { data } = await fetchAPIData<POSTV1LibraryItemAddResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function bulkCopyToLibrary(body: POSTV1LibraryItemCopyBody) {
  const url = '/api/v1/library/item/copy'

  const { data } = await fetchAPIData<POSTV1LibraryItemCopyResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function bulkMoveToLibrary(body: POSTV1LibraryItemMoveBody) {
  const url = '/api/v1/library/item/move'

  const { data } = await fetchAPIData<POSTV1LibraryItemMoveResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function bulkRemoveFromLibrary(body: DELETEV1LibraryItemBody) {
  const url = '/api/v1/library/item'

  const { data } = await fetchAPIData<DELETEV1LibraryItemResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deleteLibrary(libraryId: number) {
  const url = `/api/v1/library/${libraryId}`

  const { data } = await fetchAPIData<DELETEV1LibraryIdResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function updateLibrary(libraryId: number, body: PATCHV1LibraryIdBody) {
  const url = `/api/v1/library/${libraryId}`

  const { data } = await fetchAPIData<PATCHV1LibraryIdResponse>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
