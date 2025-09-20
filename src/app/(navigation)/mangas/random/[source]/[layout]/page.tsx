import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod/v4'

import MangaCard from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import { SHORT_NAME } from '@/constants'
import { createErrorManga } from '@/constants/json'
import { KHentaiClient } from '@/crawler/k-hentai'
import { SourceParam, ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

export const revalidate = 15

export const metadata: Metadata = {
  title: `랜덤 - ${SHORT_NAME}`,
  alternates: {
    canonical: '/mangas/random',
    languages: { ko: '/mangas/random' },
  },
}

export async function generateStaticParams() {
  const params = []
  const layouts = [ViewCookie.CARD, ViewCookie.IMAGE]
  for (const layout of layouts) {
    params.push({ source: SourceParam.K_HENTAI, layout })
  }

  return params
}

const randomSchema = z.object({
  layout: z.enum(ViewCookie),
})

export default async function Page({ params }: PageProps<'/mangas/random/[source]/[layout]'>) {
  const validation = randomSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { layout } = validation.data
  const mangas = await getMangas()

  if (mangas.length === 0) {
    notFound()
  }

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[layout]} gap-2`}>
      {mangas.map((manga, i) =>
        layout === ViewCookie.IMAGE ? (
          <li data-manga-card key={manga.id}>
            <MangaCardImage
              className="bg-zinc-900 rounded-xl border-2 relative h-fit [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-cover [&_img]:aspect-[3/4]"
              manga={manga}
              mangaIndex={i}
            />
          </li>
        ) : (
          <MangaCard index={i} key={manga.id} manga={manga} />
        ),
      )}
    </ul>
  )
}

async function getMangas() {
  try {
    return await KHentaiClient.getInstance().fetchRandomKoreanMangas()
  } catch (error) {
    return [createErrorManga({ error })]
  }
}
