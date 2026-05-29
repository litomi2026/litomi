import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { TOTAL_HIYOBI_PAGES } from '@litomi/crawler/sources/policy'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import z from 'zod'

import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import PageNavigation from '@/components/PageNavigation'
import { generateOpenGraphMetadata } from '@/lib/metadata'

import NewMangaList from './NewMangaList'

const mangasNewSchema = z.object({
  page: z.coerce.number().int().positive().max(TOTAL_HIYOBI_PAGES),
})

export async function generateMetadata({ params }: PageProps<'/new/[page]'>): Promise<Metadata> {
  const validation = mangasNewSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { page } = validation.data
  const title = page === 1 ? '신작' : `신작 ${page}페이지`
  const canonical = `/new/${page}`

  return {
    title,
    ...generateOpenGraphMetadata({
      title,
      url: canonical,
    }),
    alternates: {
      canonical,
      languages: { ko: canonical },
    },
  }
}

export async function generateStaticParams() {
  return Array.from({ length: 10 }, (_, index) => ({ page: String(index + 1) }))
}

export default async function Page({ params }: PageProps<'/new/[page]'>) {
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
    </>
  )
}
