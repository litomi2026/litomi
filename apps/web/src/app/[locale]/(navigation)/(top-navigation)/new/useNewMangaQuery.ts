import { useLocale } from 'next-intl'

import { SearchParam } from '@/app/[locale]/(navigation)/search/constants'
import { resolveFeedSearchLanguage } from '@/app/[locale]/(navigation)/search/searchLanguage'
import { useSearchQuery } from '@/app/[locale]/(navigation)/search/useSearchQuery'
import useMeQuery from '@/query/useMeQuery'

export function useNewMangaQuery() {
  const locale = useLocale()
  const { data: me } = useMeQuery()
  const language = resolveFeedSearchLanguage(me, locale)

  const params = new URLSearchParams()
  params.set(SearchParam.QUERY, `language:${language}`)

  return useSearchQuery(params)
}
