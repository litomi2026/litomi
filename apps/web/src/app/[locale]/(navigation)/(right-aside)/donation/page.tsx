import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import DonationAuthGate from './DonationAuthGate'

export async function generateMetadata({ params }: PageProps<'/[locale]/donation'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.community.donation' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/donation',
    }),
  }
}

export default function Page() {
  return <DonationAuthGate />
}
