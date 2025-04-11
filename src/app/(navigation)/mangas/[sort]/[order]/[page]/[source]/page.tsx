import MangaCard from '@/components/card/MangaCard'
import { CANONICAL_URL } from '@/constants/url'
import { fetchMangasFromHiyobi } from '@/crawler/hiyobi'
import { harpiMangaIdsByPage, harpiMangas } from '@/database/harpi'
import { hashaMangaIdsByPage, hashaMangas } from '@/database/hasha'
import { Manga } from '@/types/manga'
import { BasePageProps } from '@/types/nextjs'
import {
  OrderParam,
  SortParam,
  SourceParam,
  validateOrder,
  validatePage,
  validateSort,
  validateSource,
} from '@/utils/param'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 2592000 // 30 days

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas`,
    languages: { ko: `${CANONICAL_URL}/mangas` },
  },
}

type Params = {
  source: SourceParam
  sort: SortParam
  order: OrderParam
  page: number
}

export async function generateStaticParams() {
  const params = []
  const pages = Array.from({ length: 10 }, (_, i) => String(i + 1))
  const sources = [SourceParam.HASHA, SourceParam.HARPI, SourceParam.HIYOBI]
  for (const page of pages) {
    for (const source of sources) {
      params.push({ sort: 'id', order: 'desc', page, source })
    }
  }
  return params
}

export default async function Page({ params }: BasePageProps) {
  const { sort, order, page, source } = await params
  const sortString = validateSort(sort)
  const orderString = validateOrder(order)
  const pageNumber = validatePage(page)
  const sourceString = validateSource(source)
  if (!sortString || !orderString || !pageNumber || !sourceString) notFound()

  const mangas = await getMangas({
    source: sourceString,
    sort: sortString,
    order: orderString,
    page: pageNumber,
  })

  if (!mangas || mangas.length === 0) notFound()

  return (
    <ul className="grid md:grid-cols-2 gap-2 grow">
      {mangas.map((manga, i) => (
        <MangaCard index={i} key={manga.id} manga={manga} source={sourceString} />
      ))}
    </ul>
  )
}

async function getMangas({ source, sort, order, page }: Params) {
  let mangas: Manga[] | null = null

  if (source === SourceParam.HARPI) {
    mangas = harpiMangaIdsByPage[sort][order][page - 1]?.map((id) => harpiMangas[id])
  } else if (source === SourceParam.HASHA) {
    mangas = hashaMangaIdsByPage[sort][order][page - 1]?.map((id) => hashaMangas[id])
  } else if (source === SourceParam.HIYOBI) {
    mangas = await fetchMangasFromHiyobi({ page })
  }

  return mangas
}
