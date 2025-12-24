'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'

import type { GETV1LibraryMetaResponse } from '@/backend/api/v1/library/meta'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

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
      const response = await fetch(url, { credentials: 'include' })

      if (response.status === 404) {
        return null
      }

      return await handleResponseError<GETV1LibraryMetaResponse>(response)
    },
    enabled: Boolean(parsedLibraryId) && !currentLibraryFromList,
  })

  const currentLibrary = currentLibraryFromList ?? data ?? null

  return {
    libraryId,
    currentLibrary,
  }
}
