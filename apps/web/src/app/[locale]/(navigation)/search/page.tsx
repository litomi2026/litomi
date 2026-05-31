import type { Metadata } from 'next'

import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import { getViewFromSearchParams } from '@litomi/std'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'
import { getSearchSEO } from '@/lib/searchSEO'

import ActiveFilters, { ClearAllFilters } from './ActiveFilters'
import SearchResult, { SearchResultLoading } from './SearchResult'
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
  const resolvedSearchParams = await searchParams
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    const normalizedValue = getSearchParamValue(value)

    if (normalizedValue) {
      params.set(key, normalizedValue)
    }
  }

  const filters = {
    sort: params.get('sort'),
    minView: params.get('min-view'),
    maxView: params.get('max-view'),
    minPage: params.get('min-page'),
    maxPage: params.get('max-page'),
    minRating: params.get('min-rating'),
    maxRating: params.get('max-rating'),
    from: params.get('from'),
    to: params.get('to'),
    nextId: params.get('next-id'),
    skip: params.get('skip'),
  }

  const view = getViewFromSearchParams(params)
  const hasActiveFilters = Boolean(Object.values(filters).some(Boolean))
  const nativeGridSponsor = getNativeGridSponsor(nativeGridSponsorPlacement.SEARCH, params.get('query'))

  const header = (
    <div className="flex flex-col gap-2 p-2 pb-0">
      {hasActiveFilters ? (
        <div className="gap-2 pb-2 hidden sm:grid">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">{t('activeFilters')}</h3>
            <ClearAllFilters />
          </div>
          <ActiveFilters filters={filters} />
        </div>
      ) : (
        <TrendingKeywords view={view} />
      )}
      <JuicyAdsBanner />
    </div>
  )

  return (
    <>
      <Suspense fallback={<SearchResultLoading view={view} />}>
        <SearchResult header={header} nativeGridSponsor={nativeGridSponsor} />
      </Suspense>
    </>
  )
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}
