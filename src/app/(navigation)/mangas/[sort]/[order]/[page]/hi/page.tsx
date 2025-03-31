import MangaCard from '@/components/card/MangaCard'
import Navigation from '@/components/Navigation'
import OrderToggleLink from '@/components/OrderToggleLink'
import ShuffleButton from '@/components/ShuffleButton'
import { CANONICAL_URL } from '@/constants/url'
import { fetchMangasFromHiyobi } from '@/database/hiyobi'
import { pages } from '@/database/manga'
import { BasePageProps } from '@/types/nextjs'
import { validateOrder, validatePage, validateSort } from '@/utils/pagination'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 86400 // 1 day
export const dynamic = 'error'

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas/id/desc/1/hi`,
    languages: { ko: `${CANONICAL_URL}/mangas/id/desc/1/hi` },
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

  const mangas = await fetchMangasFromHiyobi({ page: pageNumber })

  return (
    <main className="grid gap-2">
      <div className="flex justify-end gap-2">
        <OrderToggleLink currentOrder={orderString} page={pageNumber} />
        <ShuffleButton action="random" className="w-fit " iconClassName="w-5" />
      </div>
      <ul className="grid md:grid-cols-2 gap-2">
        {mangas.map((manga, i) => (
          <MangaCard index={i} key={manga.id} manga={manga} />
        ))}
      </ul>
      <div className="flex justify-center overflow-x-auto scrollbar-hidden">
        <Navigation currentPage={pageNumber} hrefPrefix="../" hrefSuffix="/hi" totalPages={totalPages} />
      </div>
    </main>
  )
}
