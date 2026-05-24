import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { TOTAL_HIYOBI_PAGES } from '@litomi/crawler/sources/policy'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import z from 'zod'

import NonAdultJuicyAdsBanner from '@/components/ads/juicy-ads/NonAdultJuicyAdsBanner'
import PageNavigation from '@/components/PageNavigation'
import { generateOpenGraphMetadata } from '@/lib/metadata'

import NewMangaList from './NewMangaList'

export const metadata: Metadata = {
  title: '신작',
  ...generateOpenGraphMetadata({
    title: '신작',
    url: '/new/1',
  }),
  alternates: {
    canonical: '/new/1',
    languages: { ko: '/new/1' },
  },
}

export async function generateStaticParams() {
  return Array.from({ length: 10 }, (_, index) => ({ page: String(index + 1) }))
}

const mangasNewSchema = z.object({
  page: z.coerce.number().int().positive().max(TOTAL_HIYOBI_PAGES),
})

export default async function Page({ params }: PageProps<'/new/[page]'>) {
  const validation = mangasNewSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { page } = validation.data
  const nativeGridSponsor = getNativeGridSponsor(nativeGridSponsorPlacement.NEW)

  return (
    <>
      <NonAdultJuicyAdsBanner />
      <NewMangaList nativeGridSponsor={nativeGridSponsor} page={page} />
      <PageNavigation className="py-4" currentPage={page} totalPages={TOTAL_HIYOBI_PAGES} />
    </>
  )
}
