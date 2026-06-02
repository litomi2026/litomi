import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import RecommendMangaPageClient from './RecommendMangaPageClient'

export async function generateMetadata({ params }: PageProps<'/[locale]/recommend/manga'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.explore.recommendManga' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/recommend/manga',
    }),
  }
}

export default async function Page() {
  return <RecommendMangaPageClient />
}
