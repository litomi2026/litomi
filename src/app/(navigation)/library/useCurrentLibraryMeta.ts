'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'

import type { GETV1LibraryResponse } from '@/backend/api/v1/library/[id]/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type FetchLibraryMetaOptions = {
  libraryId: number
  scope: 'me' | 'public'
}

type Options = {
  libraries: GETV1LibraryResponse[]
  userId: number | null
}

export async function fetchLibraryMeta({ libraryId, scope }: FetchLibraryMetaOptions) {
  const url = new URL(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/${libraryId}`)
  url.searchParams.set('scope', scope)

  try {
    const { data } = await fetchWithErrorHandling<GETV1LibraryResponse>(url.toString(), {
      credentials: 'include',
    })
    return data
  } catch (error) {
    if (error instanceof ProblemDetailsError && error.status === 404) {
      return null
    }
    throw error
  }
}

export default function useCurrentLibraryMeta({ libraries, userId }: Options) {
  const { id: libraryId } = useParams<{ id?: string }>()
  const id = Number(libraryId)
  const parsedLibraryId = Number.isFinite(id) && id > 0 ? id : 0
  const currentLibraryFromList = parsedLibraryId ? libraries.find((lib) => lib.id === parsedLibraryId) : null

  const { data } = useQuery({
    queryKey: QueryKeys.libraryMeta(parsedLibraryId, userId),
    queryFn: async () => {
      const publicLibrary = await fetchLibraryMeta({ libraryId: parsedLibraryId, scope: 'public' })

      if (publicLibrary) {
        return publicLibrary
      }

      if (!userId) {
        return null
      }

      return await fetchLibraryMeta({ libraryId: parsedLibraryId, scope: 'me' })
    },
    enabled: Boolean(parsedLibraryId) && !currentLibraryFromList,
  })

  return {
    libraryId,
    currentLibrary: currentLibraryFromList ?? data ?? null,
  }
}
