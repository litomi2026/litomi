import MangaCard from '@/components/card/MangaCard'
import { CANONICAL_URL } from '@/constants/url'
import { fetchMangasFromHiyobi } from '@/crawler/hiyobi'
import { harpiMangaIdsByPage, harpiMangaPages, harpiMangas } from '@/database/harpi'
import { hashaMangaIdsByPage, hashaMangaPages, hashaMangas } from '@/database/hasha'
import { BasePageProps } from '@/types/nextjs'
import { validateOrder, validatePage, validateSort, validateSource } from '@/utils/param'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'error'

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas`,
    languages: { ko: `${CANONICAL_URL}/mangas` },
  },
}

export async function generateStaticParams() {
  const pageIndexes = Array.from({ length: 10 }, (_, i) => String(i + 1))
  return pageIndexes.flatMap((page) =>
    ['ha', 'hp', 'hi'].map((source) => ({
      sort: 'id',
      order: 'desc',
      page,
      source,
    })),
  )
}

export default async function Page({ params }: BasePageProps) {
  const { sort, order, page, source } = await params
  const sortString = validateSort(sort)
  const orderString = validateOrder(order)
  const pageNumber = validatePage(page)
  const sourceString = validateSource(source)

  if (!sortString || !orderString || !pageNumber || !sourceString) {
    notFound()
  }

  switch (sourceString) {
    case 'ha': {
      if (pageNumber > hashaMangaPages.length) {
        notFound()
      }

      const hashaMangaIds = hashaMangaIdsByPage[sortString][orderString][pageNumber - 1]

      return (
        <ul className="grid md:grid-cols-2 gap-2">
          {hashaMangaIds.map((id, i) => (
            <MangaCard index={i} key={id} manga={hashaMangas[id]} source={source} />
          ))}
        </ul>
      )
    }

    case 'hi': {
      const mangas = await fetchMangasFromHiyobi({ page: pageNumber })

      if (mangas.length === 0) {
        notFound()
      }

      return (
        <ul className="grid md:grid-cols-2 gap-2">
          {mangas.map((manga, i) => (
            <MangaCard index={i} key={manga.id} manga={manga} source={source} />
          ))}
        </ul>
      )
    }

    case 'hp': {
      if (pageNumber > harpiMangaPages.length) {
        notFound()
      }

      const harpiMangaIds = harpiMangaIdsByPage[sortString][orderString][pageNumber - 1]

      return (
        <ul className="grid md:grid-cols-2 gap-2">
          {harpiMangaIds.map((id, i) => (
            <MangaCard index={i} key={id} manga={harpiMangas[id]} source={source} />
          ))}
        </ul>
      )
    }

    default:
      notFound()
  }
}
