import { useQuery } from '@tanstack/react-query'

import { MangaResponseScope } from '@/app/api/proxy/manga/[id]/schema'
import { QueryKeys } from '@/constants/query'
import { Manga } from '@/types/manga'
import { handleResponseError } from '@/utils/react-query-error'

export function useMangaQuery(id: number, initialManga?: Manga | null) {
  const scope = initialManga ? MangaResponseScope.EXCLUDE_METADATA : null

  return useQuery({
    queryKey: QueryKeys.manga(id, scope),
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      if (scope) {
        searchParams.set('scope', scope)
      }

      const searchParamsString = searchParams.toString()
      const path = `/api/proxy/manga/${id}`
      const url = searchParamsString ? `${path}?${searchParamsString}` : path

      const response = await fetch(url)
      return handleResponseError<Manga>(response)
    },
    placeholderData: initialManga ?? { id, title: '불러오는 중', images: [] },
  })
}
