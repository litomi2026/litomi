import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import MangaCard from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import Navigation from '@/components/Navigation'
import { CANONICAL_URL } from '@/constants/url'
import { HiyobiClient } from '@/crawler/hiyobi'
import { KHentaiClient } from '@/crawler/k-hentai'
import { Manga } from '@/types/manga'
import { PageProps } from '@/types/nextjs'
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

export const revalidate = 86400 // 1 day

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas`,
    languages: { ko: `${CANONICAL_URL}/mangas` },
  },
}

type Params = {
  source: SourceParam
  page: number
}

export async function generateStaticParams() {
  const params = []
  const sorts = [SortParam.LATEST, SortParam.POPULAR]
  const pages = Array.from({ length: 10 }, (_, i) => String(i + 1))
  const sources = [SourceParam.HIYOBI]
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

export default async function Page({ params }: PageProps) {
  const { sort, page, source, layout } = await params
  const sortString = validateSort(sort)
  const pageNumber = validatePage(page)
  const sourceString = validateSource(source)
  const layoutString = validateView(layout)

  if (!sortString || !pageNumber || !sourceString || !layoutString) {
    notFound()
  }

  const mangas = await getMangas({
    source: sourceString,
    page: pageNumber,
  })

  if (!mangas || mangas.length === 0) {
    notFound()
  }

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

async function getMangas({ source, page }: Params) {
  let mangas: Manga[] | null = null

  if (source === SourceParam.HIYOBI) {
    mangas = await HiyobiClient.getInstance().fetchMangas(page)
  } else if (source === SourceParam.K_HENTAI) {
    mangas = await KHentaiClient.getInstance().searchKoreanMangas()
  }

  return mangas
}
