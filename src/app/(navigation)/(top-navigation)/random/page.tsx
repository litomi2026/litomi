import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import MangaCard from '@/components/card/MangaCard'
import { SHORT_NAME } from '@/constants'
import { createErrorManga } from '@/constants/json'
import { KHentaiClient } from '@/crawler/k-hentai'
import { ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import RandomMangaLink from '../RandomMangaLink'

export const revalidate = 15

export const metadata: Metadata = {
  title: `랜덤 - ${SHORT_NAME}`,
  alternates: {
    canonical: '/random',
    languages: { ko: '/random' },
  },
}

export default async function Page() {
  const mangas = await getMangas()

  if (mangas.length === 0) {
    notFound()
  }

  return (
    <>
      <div className="flex-1">
        <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[ViewCookie.CARD]} gap-2`}>
          {mangas.map((manga, i) => (
            <MangaCard index={i} key={manga.id} manga={manga} />
          ))}
        </ul>
      </div>
      <div className="flex justify-center items-center">
        <RandomMangaLink />
      </div>
    </>
  )
}

async function getMangas() {
  try {
    return await KHentaiClient.getInstance().fetchRandomKoreanMangas()
  } catch (error) {
    return [createErrorManga({ error })]
  }
}
