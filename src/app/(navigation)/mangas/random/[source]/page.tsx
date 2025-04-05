import MangaCard from '@/components/card/MangaCard'
import ShuffleButton from '@/components/ShuffleButton'
import { CANONICAL_URL } from '@/constants/url'
import { fetchRandomMangasFromHiyobi } from '@/crawler/hiyobi'
import { harpiMangaIds, harpiMangas } from '@/database/harpi'
import { hashaMangaIds, hashaMangas } from '@/database/hasha'
import { Manga } from '@/types/manga'
import { BasePageProps } from '@/types/nextjs'
import { SourceParam, validateSource } from '@/utils/param'
import { sampleBySecureFisherYates } from '@/utils/random'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'error'
export const revalidate = 15

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas/random`,
    languages: { ko: `${CANONICAL_URL}/mangas/random` },
  },
}

type Params = {
  source: string
}

export default async function Page({ params }: BasePageProps) {
  const { source } = await params
  const sourceString = validateSource(source)
  const mangas = await getMangas({ source: sourceString })

  if (!mangas || mangas.length === 0) {
    notFound()
  }

  return (
    <>
      <ul className="grid md:grid-cols-2 gap-2 grow">
        {mangas.map((manga, i) => (
          <MangaCard index={i} key={manga.id} manga={manga} source={source} />
        ))}
      </ul>
      <div className="flex justify-center items-center">
        <ShuffleButton action="refresh" href={`/mangas/random/${sourceString}`} iconClassName="w-5" />
      </div>
    </>
  )
}

async function getMangas({ source }: Params) {
  let mangas: Manga[] | null = null

  if (source === SourceParam.HARPI) {
    mangas = sampleBySecureFisherYates(harpiMangaIds, 20).map((id) => harpiMangas[id])
  } else if (source === SourceParam.HASHA) {
    mangas = sampleBySecureFisherYates(hashaMangaIds, 20).map((id) => hashaMangas[id])
  } else if (source === SourceParam.HIYOBI) {
    mangas = await fetchRandomMangasFromHiyobi()
  }

  return mangas
}
