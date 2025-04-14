import MangaCard from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import Navigation from '@/components/Navigation'
import { CANONICAL_URL } from '@/constants/url'
import { fetchMangasFromHiyobi } from '@/crawler/hiyobi'
import { fetchMangasFromKHentai } from '@/crawler/k-hentai'
import { harpiMangaIdsByPage, harpiMangas } from '@/database/harpi'
import { hashaMangaIdsByPage, hashaMangas } from '@/database/hasha'
import { Manga } from '@/types/manga'
import { BasePageProps } from '@/types/nextjs'
import { getViewerLink } from '@/utils/manga'
import { getTotalPages, SortParam, SourceParam, validatePage, validateSort, validateSource } from '@/utils/param'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 86400 // 1 day

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas`,
    languages: { ko: `${CANONICAL_URL}/mangas` },
  },
}

type Params = {
  source: SourceParam
  sort: SortParam
  page: number
}

export async function generateStaticParams() {
  const params = []
  const pages = Array.from({ length: 10 }, (_, i) => String(i + 1))
  const sources = [SourceParam.HARPI, SourceParam.HASHA, SourceParam.HIYOBI]
  for (const page of pages) {
    for (const source of sources) {
      params.push({ sort: SortParam.LATEST, page, source })
    }
  }
  const sorts = [SortParam.LATEST, SortParam.POPULAR]
  for (const sort of sorts) {
    params.push({ sort, page: '1', source: SourceParam.K_HENTAI })
  }
  return params
}

export default async function Page({ params }: BasePageProps) {
  const { sort, page, source } = await params
  const sortString = validateSort(sort)
  const pageNumber = validatePage(page)
  const sourceString = validateSource(source)
  if (!sortString || !pageNumber || !sourceString) notFound()

  const mangas = await getMangas({
    source: sourceString,
    sort: sortString,
    page: pageNumber,
  })
  if (!mangas || mangas.length === 0) notFound()

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-2 grow">
        {mangas.map((manga, i) => (
          <MangaCard index={i} key={manga.id} manga={manga} source={sourceString} />
        ))}
      </ul>
      {sourceString !== SourceParam.K_HENTAI && (
        <Navigation
          currentPage={pageNumber}
          hrefPrefix="../"
          hrefSuffix={`/${sourceString || SourceParam.HIYOBI}`}
          totalPages={getTotalPages(sourceString)}
        />
      )}
    </>
  )
}

async function getMangas({ source, sort, page }: Params) {
  let mangas: Manga[] | null = null

  if (source === SourceParam.HARPI) {
    mangas = harpiMangaIdsByPage[sort][page - 1]?.map((id) => harpiMangas[id])
  } else if (source === SourceParam.HASHA) {
    mangas = hashaMangaIdsByPage[sort][page - 1]?.map((id) => hashaMangas[id])
  } else if (source === SourceParam.HIYOBI) {
    mangas = await fetchMangasFromHiyobi({ page })
  } else if (source === SourceParam.K_HENTAI) {
    mangas = await fetchMangasFromKHentai({ sort: toKHentaiSort(sort) })
  }

  return mangas
}

function toKHentaiSort(sort: SortParam) {
  switch (sort) {
    case SortParam.LATEST:
      return ''
    case SortParam.OLDEST:
      return 'id_asc'
    case SortParam.POPULAR:
      return 'popular'
    default:
      return ''
  }
}
