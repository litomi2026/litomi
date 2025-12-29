'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'

import type { GETV1LibraryMetaResponse } from '@/backend/api/v1/library/meta'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Options = {
  libraries: GETV1LibraryMetaResponse[]
  userId: number | null
}

export default function useCurrentLibraryMeta({ libraries, userId }: Options) {
  const { id: libraryId } = useParams<{ id?: string }>()
  const id = Number(libraryId)
  const parsedLibraryId = Number.isFinite(id) && id > 0 ? id : 0
  const currentLibraryFromList = parsedLibraryId ? libraries.find((lib) => lib.id === parsedLibraryId) : null

  const { data } = useQuery({
    queryKey: QueryKeys.libraryMeta(parsedLibraryId, userId),
    queryFn: async () => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/${parsedLibraryId}/meta`
      try {
        const { data } = await fetchWithErrorHandling<GETV1LibraryMetaResponse>(url, { credentials: 'include' })
        return data
      } catch (error) {
        if (error instanceof ProblemDetailsError && error.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: Boolean(parsedLibraryId) && !currentLibraryFromList,
  })

  const currentLibrary = currentLibraryFromList ?? data ?? null

  return {
    libraryId,
    currentLibrary,
  }
}
