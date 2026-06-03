import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import RatingPageClient from './page.client'

export async function generateMetadata({ params }: PageProps<'/[locale]/library/rating'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.library.rating' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/library/rating',
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/library/rating'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.library.rating' })

  return (
    <main className="flex-1 flex flex-col">
      <h1 className="sr-only">{t('title')}</h1>
      <RatingPageClient />
    </main>
  )
}
