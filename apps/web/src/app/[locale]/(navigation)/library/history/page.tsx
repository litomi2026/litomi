import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import HistoryPageClient from './HistoryPageClient'

export async function generateMetadata({ params }: PageProps<'/[locale]/library/history'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.library.history' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/library/history',
    }),
  }
}

export default function HistoryPage() {
  return (
    <main className="flex-1 flex flex-col">
      <HistoryPageClient />
    </main>
  )
}
