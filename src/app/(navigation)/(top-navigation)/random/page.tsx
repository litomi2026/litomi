import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import MangaCard from '@/components/card/MangaCard'
import MangaCardDonation from '@/components/card/MangaCardDonation'
import { createErrorManga } from '@/constants/json'
import { kHentaiClient } from '@/crawler/k-hentai'
import { ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import RandomMangaLink from '../RandomMangaLink'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '랜덤',
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
          <MangaCardDonation />
        </ul>
      </div>
      <div className="flex justify-center items-center">
        <RandomMangaLink timer={20} />
      </div>
    </>
  )
}

async function getMangas() {
  try {
    return await kHentaiClient.fetchRandomKoreanMangas(15)
  } catch (error) {
    return [createErrorManga({ error })]
  }
}
