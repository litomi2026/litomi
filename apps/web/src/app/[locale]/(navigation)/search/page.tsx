import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'
import { getSearchSEO } from '@/lib/searchSEO'

import ActiveFilters, { ClearAllFilters } from './ActiveFilters'
import { SearchParam } from './constants'
import SearchResult from './SearchResult'
import { getLanguageFilter } from './searchLanguage'
import TrendingKeywords from './TrendingKeywords'

export async function generateMetadata({ params, searchParams }: PageProps<'/[locale]/search'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.search' })

  const seo = getSearchSEO(await searchParams, {
    defaultDescription: t('description'),
    defaultTitle: t('title'),
    landingQueryLabels: t.raw('landingQueryLabels') as Record<string, string>,
    queryDescription: (query) => t('queryDescription', { query }),
    queryTitle: (query) => t('queryTitle', { query }),
  })

  return {
    title: seo.title,
    description: seo.description,
    robots: seo.robots,
    ...generateLocalizedMetadata({
      title: seo.title,
      description: seo.description,
      locale,
      pathname: seo.canonical,
    }),
  }
}

export default async function Page({ searchParams }: PageProps<'/[locale]/search'>) {
  const t = await getTranslations('Search')
  const params = getURLSearchParams(await searchParams)

  const filters = {
    sort: params.get(SearchParam.SORT),
    language: getLanguageFilter(params.get(SearchParam.QUERY)),
    minView: params.get(SearchParam.MIN_VIEW),
    maxView: params.get(SearchParam.MAX_VIEW),
    minPage: params.get(SearchParam.MIN_PAGE),
    maxPage: params.get(SearchParam.MAX_PAGE),
    minRating: params.get(SearchParam.MIN_RATING),
    maxRating: params.get(SearchParam.MAX_RATING),
    from: params.get(SearchParam.FROM),
    to: params.get(SearchParam.TO),
    nextId: params.get(SearchParam.NEXT_ID),
    skip: params.get(SearchParam.SKIP),
  }

  const hasActiveFilters = Boolean(Object.values(filters).some(Boolean))
  const nativeGridSponsor = getNativeGridSponsor(nativeGridSponsorPlacement.SEARCH, params.get(SearchParam.QUERY))

  const header = (
    <div className="flex flex-col gap-2 p-2 pb-0">
      {hasActiveFilters ? (
        <div className="gap-2 p-1 hidden sm:grid">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">{t('activeFilters')}</h3>
            <ClearAllFilters />
          </div>
          <ActiveFilters filters={filters} />
        </div>
      ) : (
        <TrendingKeywords />
      )}
      <JuicyAdsBanner />
    </div>
  )

  return <SearchResult header={header} nativeGridSponsor={nativeGridSponsor} searchParams={params.toString()} />
}

function getURLSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    const firstValue = Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

    if (firstValue) {
      params.set(key, firstValue)
    }
  }

  return params
}
