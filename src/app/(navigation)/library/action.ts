'use server'

import { ok, unauthorized } from '@/utils/action-response'
import { getUserIdFromCookie } from '@/utils/session'

export async function addMangaToLibrary(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  return ok(null)
}

export async function bulkCopyToLibrary(data: { fromLibraryId: number; toLibraryId: number; mangaIds: number[] }) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  return ok(null)
}

export async function bulkMoveToLibrary(data: { fromLibraryId: number; toLibraryId: number; mangaIds: number[] }) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  return ok(null)
}

export async function bulkRemoveFromLibrary(data: { libraryId: number; mangaIds: number[] }) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  return ok(null)
}

export async function createLibrary(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  return ok(null)
}
