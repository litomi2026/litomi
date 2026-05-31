import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import RealtimeRanking from './RealtimeRanking'
import RealtimeToggleButton from './RealtimeToggleButton'

export async function generateMetadata({ params }: PageProps<'/[locale]/realtime'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.ranking.realtime' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/realtime',
    }),
  }
}

export default async function RealtimePage() {
  const t = await getTranslations('RealtimeRanking')

  return (
    <div className="grid gap-6 mx-auto max-w-screen-sm w-full p-4">
      <h1 className="text-3xl font-bold sr-only">{t('title')}</h1>
      <RealtimeToggleButton />
      <RealtimeRanking />
    </div>
  )
}
