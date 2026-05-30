import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import TransactionHistory from './TransactionHistory'

export async function generateMetadata({ params }: PageProps<'/[locale]/libo/history'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.libo.history' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/libo/history',
    }),
  }
}

export default function HistoryPage() {
  return <TransactionHistory />
}
