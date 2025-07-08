import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import MangaCard from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import { CANONICAL_URL } from '@/constants/url'
import { HiyobiClient } from '@/crawler/hiyobi'
import { KHentaiClient } from '@/crawler/k-hentai'
import { harpiMangaIds, harpiMangas } from '@/database/harpi'
import { Manga } from '@/types/manga'
import { BasePageProps } from '@/types/nextjs'
import { getViewerLink } from '@/utils/manga'
import { SourceParam, validateSource, validateView, ViewCookie } from '@/utils/param'
import { sampleBySecureFisherYates } from '@/utils/random'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

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

export async function generateStaticParams() {
  const params = []
  const sources = [SourceParam.HIYOBI]
  const layouts = [ViewCookie.CARD, ViewCookie.IMAGE]
  for (const source of sources) {
    for (const layout of layouts) {
      params.push({ source, layout })
    }
  }
  return params
}

export default async function Page({ params }: BasePageProps) {
  const { source, layout } = await params
  const sourceString = validateSource(source)
  const layoutString = validateView(layout)
  if (!sourceString || !layoutString) notFound()

  const mangas = await getMangas({ source: sourceString })
  if (!mangas || mangas.length === 0) notFound()

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[layoutString]} gap-2 grow`}>
      {mangas.map((manga, i) =>
        layoutString === ViewCookie.IMAGE ? (
          <MangaCardImage
            className="bg-zinc-900 rounded-xl border-2 relative h-fit [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-cover [&_img]:aspect-[3/4]"
            href={getViewerLink(manga.id, sourceString)}
            index={i}
            key={manga.id}
            manga={manga}
          />
        ) : (
          <MangaCard index={i} key={manga.id} manga={manga} source={sourceString} />
        ),
      )}
    </ul>
  )
}

async function getMangas({ source }: Params) {
  let mangas: Manga[] | null = null

  if (source === SourceParam.HARPI) {
    mangas = sampleBySecureFisherYates(harpiMangaIds, 20).map((id) => harpiMangas[id])
  } else if (source === SourceParam.HIYOBI) {
    mangas = await HiyobiClient.getInstance().fetchRandomMangas()
  } else if (source === SourceParam.K_HENTAI) {
    mangas = await KHentaiClient.getInstance().fetchRandomKoreanMangas()
  }

  return mangas
}
