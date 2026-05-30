import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import JuicyAdsScript from '@/components/ads/juicy-ads/JuicyAdsScript'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import RewardedAdSection from './RewardedAdSection'

export async function generateMetadata({ params }: PageProps<'/[locale]/libo'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.libo.index' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/libo',
    }),
  }
}

export default function PointsPage() {
  return (
    <>
      <JuicyAdsScript />
      <RewardedAdSection />
    </>
  )
}
