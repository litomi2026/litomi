import type { Metadata } from 'next'

import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import { getTranslations } from 'next-intl/server'

import ScrollButtons from '@/components/ScrollButtons'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import RandomMangaList from './RandomMangaList'

export async function generateMetadata({ params }: PageProps<'/[locale]/random'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.explore.random' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/random',
    }),
  }
}

export default function Page() {
  const nativeGridSponsor = getNativeGridSponsor(nativeGridSponsorPlacement.RANDOM)

  return (
    <>
      <RandomMangaList nativeGridSponsor={nativeGridSponsor} />
      <ScrollButtons />
    </>
  )
}
