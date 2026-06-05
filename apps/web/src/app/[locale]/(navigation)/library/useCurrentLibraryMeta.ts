'use client'

import type { GETV1LibraryResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, ProblemDetailsError, withQuery } from '@/utils/api-request'

type FetchAccessibleLibraryMetaOptions = {
  libraryId: number
  userId?: number
}

type FetchLibraryMetaOptions = {
  libraryId: number
  scope: 'me' | 'public'
}

type LibraryMetaQueryOptions = {
  enabled?: boolean
  libraryId: number
  userId?: number
}

type UseCurrentLibraryMetaOptions = {
  enabled?: boolean
  userId?: number
}

export default function useCurrentLibraryMeta({ enabled = true, userId }: UseCurrentLibraryMetaOptions) {
  const { id: libraryId } = useParams<{ id?: string }>()
  const id = Number(libraryId)
  const parsedLibraryId = Number.isFinite(id) && id > 0 ? id : 0

  const { data } = useLibraryMetaQuery({
    libraryId: parsedLibraryId,
    userId,
    enabled,
  })

  return data ?? null
}

export function useLibraryMetaQuery({ enabled = true, libraryId, userId }: LibraryMetaQueryOptions) {
  return useQuery({
    queryKey: QueryKeys.libraryMeta(libraryId, userId),
    queryFn: () => fetchAccessibleLibraryMeta({ libraryId, userId }),
    enabled: Boolean(libraryId) && enabled,
    meta: userId ? { requiresAdult: true } : undefined,
  })
}

async function fetchAccessibleLibraryMeta({ libraryId, userId }: FetchAccessibleLibraryMetaOptions) {
  const publicLibrary = await fetchLibraryMeta({ libraryId, scope: 'public' })

  if (publicLibrary || !userId) {
    return publicLibrary
  }

  return await fetchLibraryMeta({ libraryId, scope: 'me' })
}

async function fetchLibraryMeta({ libraryId, scope }: FetchLibraryMetaOptions) {
  const url = withQuery(`/api/v1/library/${libraryId}`, new URLSearchParams({ scope }))
  const credentials = scope === 'me' ? 'same-origin' : 'omit'

  try {
    const { data } = await fetchAPIData<GETV1LibraryResponse>(url, { credentials })
    return data
  } catch (error) {
    if (error instanceof ProblemDetailsError && error.status === 404) {
      return null
    }
    throw error
  }
}
