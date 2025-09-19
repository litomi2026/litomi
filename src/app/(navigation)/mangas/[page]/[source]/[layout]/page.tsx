import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import MangaCard from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import Navigation from '@/components/Navigation'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { createErrorManga } from '@/constants/json'
import { HiyobiClient } from '@/crawler/hiyobi'
import { SourceParam, ViewCookie } from '@/utils/param'
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

export async function generateStaticParams() {
  const params = []
  const views = [ViewCookie.CARD, ViewCookie.IMAGE]
  const pages = Array.from({ length: 10 }, (_, i) => String(i + 1))

  for (const view of views) {
    for (const page of pages) {
      params.push({ page, source: SourceParam.HIYOBI, layout: view })
    }
  }

  return params
}

export default async function Page({ params }: PageProps<'/mangas/[page]/[source]/[layout]'>) {
  const validation = mangasSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { page, layout } = validation.data
  const mangas = await getMangas({ page })

  if (!mangas || mangas.length === 0) {
    notFound()
  }

  return (
    <>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[layout]} gap-2 grow`}>
        {mangas.map((manga, i) =>
          layout === ViewCookie.IMAGE ? (
            <li data-manga-card key={manga.id}>
              <MangaCardImage
                className="bg-zinc-900 rounded-xl border-2 relative [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-cover [&_img]:aspect-[3/4]"
                manga={manga}
                mangaIndex={i}
              />
            </li>
          ) : (
            <MangaCard index={i} key={manga.id} manga={manga} />
          ),
        )}
      </ul>
      <Navigation
        currentPage={page}
        hrefPrefix="../../"
        hrefSuffix={`/${SourceParam.HIYOBI}/${layout}`}
        totalPages={7500}
      />
    </>
  )
}

async function getMangas({ page }: { page: number }) {
  // cacheLife('hours')
  try {
    return await HiyobiClient.getInstance().fetchMangas(page)
  } catch (error) {
    return [createErrorManga({ error })]
  }
}
