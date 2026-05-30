import type { Metadata } from 'next'

import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import { View } from '@litomi/std'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import NotFound from './[id]/not-found'
import AllLibraryMangaView from './AllLibraryMangaView'

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

const searchParamsSchema = z.object({
  view: z.enum(View).default(View.CARD),
})

export default async function LibraryPage({ searchParams }: PageProps<'/[locale]/library'>) {
  const validation = searchParamsSchema.safeParse(await searchParams)

  if (!validation.success) {
    return <NotFound />
  }

  const { view } = validation.data
  const nativeGridSponsor = getNativeGridSponsor(nativeGridSponsorPlacement.LIBRARY_HOME)

  return <AllLibraryMangaView initialView={view} nativeGridSponsor={nativeGridSponsor} />
}
