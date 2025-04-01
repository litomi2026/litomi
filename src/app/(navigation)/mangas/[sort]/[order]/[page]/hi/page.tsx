import MangaCard from '@/components/card/MangaCard'
import Navigation from '@/components/Navigation'
import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceToggleLink'
import { CANONICAL_URL } from '@/constants/url'
import { fetchMangasFromHiyobi } from '@/crawler/hiyobi'
import { hashaMangaPages } from '@/database/hasha'
import { BasePageProps } from '@/types/nextjs'
import { validateOrder, validatePage, validateSort } from '@/utils/param'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'error'
export const revalidate = 86400 // 1 day

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
  const totalPages = hashaMangaPages.length

  if (!sortString || !orderString || !pageNumber || pageNumber > totalPages) {
    notFound()
  }

  const mangas = await fetchMangasFromHiyobi({ page: pageNumber })
  const source = 'hi'

  return (
    <main className="grid gap-2">
      <div className="flex justify-end gap-2 flex-wrap whitespace-nowrap">
        <SourceSliderLink currentSource={source} />
        <ShuffleButton action="random" className="w-fit" href={`/mangas/random/${source}`} iconClassName="w-5" />
      </div>
      <ul className="grid md:grid-cols-2 gap-2">
        {mangas.map((manga, i) => (
          <MangaCard index={i} key={manga.id} manga={manga} source={source} />
        ))}
      </ul>
      <div className="flex justify-center overflow-x-auto scrollbar-hidden">
        <Navigation currentPage={pageNumber} hrefPrefix="../" hrefSuffix={source} totalPages={totalPages} />
      </div>
    </main>
  )
}
