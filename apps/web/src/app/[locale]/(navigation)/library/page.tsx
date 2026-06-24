import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import PublicLibraryMangaView from './PublicLibraryMangaView'

export async function generateMetadata({ params }: PageProps<'/[locale]/library'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.library.index' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/library',
    }),
  }
}

export default function LibraryPage() {
  const nativeGridSponsor = getNativeGridSponsor(nativeGridSponsorPlacement.LIBRARY_HOME)

  return <PublicLibraryMangaView nativeGridSponsor={nativeGridSponsor} />
}
