import MangaCard from '@/components/MangaCard'
import Navigation from '@/components/Navigation'
import OrderToggleLink from '@/components/OrderToggleLink'
import { CANONICAL_URL } from '@/constants/url'
import { mangas, pages, paginatedMangaIds } from '@/database/manga'
import { BasePageProps } from '@/types/nextjs'
import { validateOrder, validatePage, validateSort } from '@/utils/pagination'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'error'

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas/id/desc/1`,
    languages: { ko: `${CANONICAL_URL}/mangas/id/desc/1` },
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
  const totalPages = pages.length

  if (!sortString || !orderString || !pageNumber || pageNumber > totalPages) {
    notFound()
  }

  const currentMangaIds = paginatedMangaIds[sortString][orderString][pageNumber - 1]

  return (
    <main className="grid gap-2">
      <div className="flex justify-end">
        <OrderToggleLink currentOrder={orderString} page={pageNumber} />
      </div>
      <ul className="grid md:grid-cols-2 gap-2">
        {currentMangaIds.map((id, i) => (
          <MangaCard index={i} key={id} manga={mangas[id]} />
        ))}
      </ul>
      <div className="flex justify-center overflow-x-auto scrollbar-hidden">
        <Navigation currentPage={pageNumber} totalPages={totalPages} />
      </div>
    </main>
  )
}
