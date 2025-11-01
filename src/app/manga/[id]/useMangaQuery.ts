import { useQuery } from '@tanstack/react-query'

import { MangaResponseScope } from '@/app/api/proxy/manga/[id]/types'
import { QueryKeys } from '@/constants/query'
import useLocaleFromCookie from '@/hook/useLocaleFromCookie'
import { Manga } from '@/types/manga'
import { handleResponseError } from '@/utils/react-query-error'

export function useMangaQuery(id: number, initialManga?: Manga | null) {
  const scope = initialManga ? MangaResponseScope.EXCLUDE_METADATA : null
  const locale = useLocaleFromCookie()

  return useQuery({
    queryKey: QueryKeys.manga(id, scope),
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      if (locale) {
        searchParams.set('locale', locale)
      }

      if (scope) {
        searchParams.set('scope', scope)
      }

      const response = await fetch(`/api/proxy/manga/${id}?${searchParams}`)
      return handleResponseError<Manga>(response)
    },
    placeholderData: initialManga ?? { id, title: '불러오는 중' },
    enabled: !(initialManga?.images?.length ?? 0 > 0), // TODO: 모든 작품 이미지를 R2 저장소로 자동 관리할 떄 지우기
  })
}
