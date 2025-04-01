import MangaCard from '@/components/card/MangaCard'
import { CANONICAL_URL } from '@/constants/url'
import { fetchRandomMangasFromHiyobi } from '@/crawler/hiyobi'
import { mangaIds, mangas } from '@/database/manga'
import { BasePageProps } from '@/types/nextjs'
import { validateSource } from '@/utils/param'
import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'

export const dynamic = 'error'
export const revalidate = 60

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas/random`,
    languages: { ko: `${CANONICAL_URL}/mangas/random` },
  },
}

const tags = ['mangas', 'random', 'hi']

const getMangas = unstable_cache(fetchRandomMangasFromHiyobi, tags, {
  revalidate: 20,
  tags,
})

export default async function Page({ params }: BasePageProps) {
  const { source } = await params
  const sourceString = validateSource(source)

  if (!sourceString) {
    notFound()
  }

  if (sourceString === 'hi') {
    const randomMangas = await getMangas()

    if (!randomMangas) {
      notFound()
    }

    return (
      <ul className="grid md:grid-cols-2 gap-2">
        {randomMangas.map((manga, i) => (
          <MangaCard index={i} key={manga.id} manga={manga} source={sourceString} />
        ))}
      </ul>
    )
  }

  const currentMangaIds = mangaIds.sort(() => Math.random() - 0.5).slice(0, 20)

  return (
    <ul className="grid md:grid-cols-2 gap-2">
      {currentMangaIds.map((id, i) => (
        <MangaCard index={i} key={id} manga={mangas[id]} source={sourceString} />
      ))}
    </ul>
  )
}
