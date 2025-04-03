import MangaCard from '@/components/card/MangaCard'
import { CANONICAL_URL } from '@/constants/url'
import { fetchRandomMangasFromHiyobi } from '@/crawler/hiyobi'
import { harpiMangaIds, harpiMangas } from '@/database/harpi'
import { hashaMangaIds, hashaMangas } from '@/database/hasha'
import { BasePageProps } from '@/types/nextjs'
import { validateSource } from '@/utils/param'
import { sampleBySecureFisherYates } from '@/utils/random'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'error'
export const revalidate = 20

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas/random`,
    languages: { ko: `${CANONICAL_URL}/mangas/random` },
  },
}

export default async function Page({ params }: BasePageProps) {
  const { source } = await params
  const sourceString = validateSource(source)

  switch (sourceString) {
    case 'ha': {
      const randomMangaIds = sampleBySecureFisherYates(hashaMangaIds, 20)

      return (
        <ul className="grid md:grid-cols-2 gap-2">
          {randomMangaIds.map((id, i) => (
            <MangaCard index={i} key={id} manga={hashaMangas[id]} source={sourceString} />
          ))}
        </ul>
      )
    }

    case 'hi': {
      const randomMangas = await fetchRandomMangasFromHiyobi()

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

    case 'hp': {
      const randomMangaIds = sampleBySecureFisherYates(harpiMangaIds, 20)

      return (
        <ul className="grid md:grid-cols-2 gap-2">
          {randomMangaIds.map((id, i) => (
            <MangaCard index={i} key={id} manga={harpiMangas[id]} source={sourceString} />
          ))}
        </ul>
      )
    }

    default:
      notFound()
  }
}
