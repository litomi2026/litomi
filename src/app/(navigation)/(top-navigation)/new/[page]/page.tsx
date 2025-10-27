import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import z from 'zod/v4'

import MangaCard from '@/components/card/MangaCard'
import MangaCardDonation from '@/components/card/MangaCardDonation'
import Navigation from '@/components/Navigation'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { createErrorManga } from '@/constants/json'
import { TOTAL_HIYOBI_PAGES } from '@/constants/policy'
import { hiyobiClient } from '@/crawler/hiyobi'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

export const dynamic = 'force-static'
export const revalidate = 21600 // 6 hours

export const metadata: Metadata = {
  title: '신작',
  openGraph: {
    ...defaultOpenGraph,
    title: `신작 - ${SHORT_NAME}`,
    url: '/new/1',
  },
  alternates: {
    canonical: '/new/1',
    languages: { ko: '/new/1' },
  },
}

export async function generateStaticParams() {
  return Array.from({ length: 9 }, (_, i) => String(i + 1)).map((page) => ({ page }))
}

const mangasNewSchema = z.object({
  page: z.coerce.number().int().positive(),
})

export default async function Page({ params }: PageProps<'/new/[page]'>) {
  const validation = mangasNewSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { page } = validation.data
  const mangas = await getMangas(page)

  if (mangas.length === 0) {
    notFound()
  }

  return (
    <>
      <div className="flex-1">
        <ul className={`grid ${MANGA_LIST_GRID_COLUMNS.card} gap-2`}>
          {mangas.map((manga, i) => (
            <MangaCard index={i} key={manga.id} manga={manga} />
          ))}
          <MangaCardDonation />
        </ul>
      </div>
      <Navigation className="py-4" currentPage={page} totalPages={TOTAL_HIYOBI_PAGES} />
    </>
  )
}

async function getMangas(page: number) {
  try {
    return await hiyobiClient.fetchMangas({ page })
  } catch (error) {
    return [createErrorManga({ error })]
  }
}
