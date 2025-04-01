import MangaCard from '@/components/card/MangaCard'
import Navigation from '@/components/Navigation'
import OrderToggleLink from '@/components/OrderToggleLink'
import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceToggleLink'
import { CANONICAL_URL } from '@/constants/url'
import { hashaMangaIdsByPage, hashaMangaPages, hashaMangas } from '@/database/hasha'
import { BasePageProps } from '@/types/nextjs'
import { validateOrder, validatePage, validateSort } from '@/utils/param'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'error'

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas/id/desc/1/ha`,
    languages: { ko: `${CANONICAL_URL}/mangas/id/desc/1/ha` },
  },
}

export async function generateStaticParams() {
  const pageIndexes = Array.from({ length: 10 }, (_, i) => String(i + 1))
  return pageIndexes.map((page) => ({ sort: 'id', order: 'desc', page }))
}

export default async function Page({ params }: BasePageProps) {
  const { sort, order, page } = await params
  const sortString = validateSort(sort)
  const orderString = validateOrder(order)
  const pageNumber = validatePage(page)
  const totalPages = hashaMangaPages.length

  if (!sortString || !orderString || !pageNumber || pageNumber > totalPages) {
    notFound()
  }

  const currentMangaIds = hashaMangaIdsByPage[sortString][orderString][pageNumber - 1]
  const source = 'ha'

  return (
    <main className="grid gap-2">
      <div className="flex justify-end gap-2 flex-wrap whitespace-nowrap">
        <OrderToggleLink currentOrder={orderString} hrefPrefix="../../" hrefSuffix={`/${pageNumber}/${source}`} />
        <SourceSliderLink currentSource={source} />
        <ShuffleButton action="random" className="w-fit" href={`/mangas/random/${source}`} iconClassName="w-5" />
      </div>
      <ul className="grid md:grid-cols-2 gap-2">
        {currentMangaIds.map((id, i) => (
          <MangaCard index={i} key={id} manga={hashaMangas[id]} source={source} />
        ))}
      </ul>
      <div className="flex justify-center overflow-x-auto scrollbar-hidden">
        <Navigation currentPage={pageNumber} totalPages={totalPages} />
      </div>
    </main>
  )
}
