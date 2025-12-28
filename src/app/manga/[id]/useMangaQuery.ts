import { useQuery } from '@tanstack/react-query'

import { MangaResponseScope } from '@/app/api/proxy/manga/[id]/types'
import { QueryKeys } from '@/constants/query'
import useLocaleFromCookie from '@/hook/useLocaleFromCookie'
import { Manga } from '@/types/manga'
import { isDegradedResponse } from '@/utils/degraded-response'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

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

      const { data, response } = await fetchWithErrorHandling<Manga>(`/api/proxy/manga/${id}?${searchParams}`)

      if (initialManga && isDegradedResponse(response.headers)) {
        // NOTE: degraded 응답은 이미지 위주이므로, 기존 메타데이터(initialManga)를 최대한 유지해요.
        return { ...initialManga, ...data, title: initialManga.title }
      }

      return data
    },
    placeholderData: initialManga ?? { id, title: '불러오는 중' },
    enabled: !(initialManga?.images?.length ?? 0 > 0), // TODO: 모든 작품 이미지를 R2 저장소로 자동 관리할 떄 지우기
  })
}
