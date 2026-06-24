import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { TOTAL_HIYOBI_PAGES } from '@litomi/crawler/sources/policy'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import z from 'zod'

import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import PageNavigation from '@/components/PageNavigation'
import ScrollButtons from '@/components/ScrollButtons'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import NewMangaList from './NewMangaList'

const mangasNewSchema = z.object({
  page: z.coerce.number().int().positive().max(TOTAL_HIYOBI_PAGES),
})

export async function generateMetadata({ params }: PageProps<'/[locale]/new/[page]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const validation = mangasNewSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { page } = validation.data
  const t = await getTranslations({ locale, namespace: 'Metadata.explore.new' })
  const title = page === 1 ? t('title') : t('pagedTitle', { page })
  const description = t('description')
  const pathname = `/new/${page}`

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname,
    }),
  }
}

export async function generateStaticParams() {
  return Array.from({ length: 10 }, (_, index) => ({ page: String(index + 1) }))
}

export default async function Page({ params }: PageProps<'/[locale]/new/[page]'>) {
  const validation = mangasNewSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { page } = validation.data
  const nativeGridSponsor = getNativeGridSponsor(nativeGridSponsorPlacement.NEW)

  return (
    <>
      <JuicyAdsBanner />
      <NewMangaList nativeGridSponsor={nativeGridSponsor} page={page} />
      <PageNavigation className="py-4" currentPage={page} totalPages={TOTAL_HIYOBI_PAGES} />
      <ScrollButtons />
    </>
  )
}
