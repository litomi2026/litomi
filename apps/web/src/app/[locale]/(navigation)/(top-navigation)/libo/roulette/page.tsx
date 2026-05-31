import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import RoulettePageClient from './roulette-page-client'

export async function generateMetadata({ params }: PageProps<'/[locale]/libo/roulette'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.libo.roulette' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/libo/roulette',
    }),
  }
}

export default function RoulettePage() {
  return <RoulettePageClient />
}
