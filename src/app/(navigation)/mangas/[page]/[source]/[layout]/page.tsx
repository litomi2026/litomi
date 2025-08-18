import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import MangaCard from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import Navigation from '@/components/Navigation'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { createErrorManga } from '@/constants/json'
import { HiyobiClient } from '@/crawler/hiyobi'
import { KHentaiClient } from '@/crawler/k-hentai'
import { PageProps } from '@/types/nextjs'
import { getViewerLink } from '@/utils/manga'
import { getTotalPages, SourceParam, ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { mangasSchema } from './schema'

export const dynamic = 'error'

export const metadata: Metadata = {
  title: `목록 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `목록 - ${SHORT_NAME}`,
    url: '/mangas',
  },
  alternates: {
    canonical: '/mangas',
    languages: { ko: '/mangas' },
  },
}

type Params = {
  source: SourceParam
  page: number
}

export async function generateStaticParams() {
  const params = []
  const views = [ViewCookie.CARD, ViewCookie.IMAGE]
  const pages = Array.from({ length: 10 }, (_, i) => String(i + 1))

  for (const view of views) {
    for (const page of pages) {
      params.push({ page, source: SourceParam.HIYOBI, layout: view })
    }
  }

  for (const view of views) {
    params.push({ page: '1', source: SourceParam.K_HENTAI, layout: view })
  }

  return params
}

export default async function Page({ params }: PageProps) {
  const validation = mangasSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { page, source, layout } = validation.data
  const mangas = await getMangas({ source, page })

  if (!mangas || mangas.length === 0) {
    notFound()
  }

  return (
    <>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[layout]} gap-2 grow`}>
        {mangas.map((manga, i) =>
          layout === ViewCookie.IMAGE ? (
            <MangaCardImage
              className="bg-zinc-900 rounded-xl border-2 relative [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-cover [&_img]:aspect-[3/4]"
              href={getViewerLink(manga.id)}
              key={manga.id}
              manga={manga}
              mangaIndex={i}
            />
          ) : (
            <MangaCard index={i} key={manga.id} manga={manga} />
          ),
        )}
      </ul>
      {source !== SourceParam.K_HENTAI && (
        <Navigation
          currentPage={page}
          hrefPrefix="../../"
          hrefSuffix={`/${source || SourceParam.HIYOBI}/${layout}`}
          totalPages={getTotalPages(source)}
        />
      )}
    </>
  )
}

async function getMangas({ source, page }: Params) {
  // cacheLife('hours')
  try {
    if (source === SourceParam.HIYOBI) {
      return await HiyobiClient.getInstance().fetchMangas(page)
    } else if (source === SourceParam.K_HENTAI) {
      return await KHentaiClient.getInstance().searchKoreanMangas()
    }
  } catch (error) {
    return [createErrorManga({ error })]
  }
}
