import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import z from 'zod/v4'

import MangaCard from '@/components/card/MangaCard'
import Navigation from '@/components/Navigation'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { createErrorManga } from '@/constants/json'
import { HiyobiClient } from '@/crawler/hiyobi'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: `신작 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `신작 - ${SHORT_NAME}`,
    url: '/mangas/new',
  },
  alternates: {
    canonical: '/mangas/new',
    languages: { ko: '/mangas/new' },
  },
}

// export async function generateStaticParams() {
//   return Array.from({ length: 10 }, (_, i) => String(i + 1)).map((page) => ({ page }))
// }

const mangasNewSchema = z.object({
  page: z.coerce.number().int().positive(),
})

export default async function Page({ params }: PageProps<'/mangas/new/[page]'>) {
  const validation = mangasNewSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { page } = validation.data
  const mangas = await getMangas({ page })

  if (mangas.length === 0) {
    notFound()
  }

  return (
    <>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS.card} gap-2 grow`}>
        {mangas.map((manga, i) => (
          <MangaCard index={i} key={manga.id} manga={manga} />
        ))}
      </ul>
      <Navigation currentPage={page} totalPages={7500} />
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
