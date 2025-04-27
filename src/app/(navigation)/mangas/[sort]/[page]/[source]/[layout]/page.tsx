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
import {
  getTotalPages,
  SortParam,
  SourceParam,
  validatePage,
  validateSort,
  validateSource,
  validateView,
  ViewCookie,
} from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'
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
  const sorts = [SortParam.LATEST, SortParam.POPULAR]
  const pages = Array.from({ length: 10 }, (_, i) => String(i + 1))
  const sources = [SourceParam.HASHA, SourceParam.HIYOBI]
  const views = [ViewCookie.CARD, ViewCookie.IMAGE]
  for (const view of views) {
    for (const page of pages) {
      for (const source of sources) {
        params.push({ sort: SortParam.LATEST, page, source, layout: view })
      }
    }
  }
  for (const view of views) {
    for (const sort of sorts) {
      params.push({ sort, page: '1', source: SourceParam.K_HENTAI, layout: view })
    }
  }
  for (const view of views) {
    params.push({ sort: SortParam.LATEST, page: '1', source: SourceParam.HARPI, layout: view })
  }
  return params
}

export default async function Page({ params }: BasePageProps) {
  const { sort, page, source, layout } = await params
  const sortString = validateSort(sort)
  const pageNumber = validatePage(page)
  const sourceString = validateSource(source)
  const layoutString = validateView(layout)
  if (!sortString || !pageNumber || !sourceString || !layoutString) notFound()

  const mangas = await getMangas({
    source: sourceString,
    sort: sortString,
    page: pageNumber,
  })
  if (!mangas || mangas.length === 0) notFound()

  return (
    <>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[layoutString]} gap-2 grow`}>
        {mangas.map((manga, i) =>
          layoutString === ViewCookie.IMAGE ? (
            <MangaCardImage
              className="bg-zinc-900 rounded-xl border-2 relative [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-cover [&_img]:aspect-[3/4]"
              href={getViewerLink(manga.id, sourceString)}
              index={i}
              key={manga.id}
              manga={manga}
            />
          ) : (
            <MangaCard index={i} key={manga.id} manga={manga} source={sourceString} />
          ),
        )}
      </ul>
      {sourceString !== SourceParam.K_HENTAI && (
        <Navigation
          currentPage={pageNumber}
          hrefPrefix="../../"
          hrefSuffix={`/${sourceString || SourceParam.HIYOBI}/${layoutString}`}
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
