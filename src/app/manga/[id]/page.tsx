import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { MAX_MANGA_DESCRIPTION_LENGTH, MAX_MANGA_TITLE_LENGTH } from '@/constants/policy'
import { KHentaiClient } from '@/crawler/k-hentai'
import { LitomiClient } from '@/crawler/litomi'

import MangaViewer from './MangaViewer'
import { mangaSchema } from './schema'

export const dynamic = 'error'

export async function generateMetadata({ params }: PageProps<'/manga/[id]'>): Promise<Metadata> {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const manga = await getManga(id)
  const slicedTitle = manga?.title?.slice(0, MAX_MANGA_TITLE_LENGTH) || '작품'
  const slicedDescription = manga?.description?.slice(0, MAX_MANGA_DESCRIPTION_LENGTH)

  return {
    title: `${slicedTitle} - ${SHORT_NAME}`,
    description: slicedDescription,
    openGraph: {
      ...defaultOpenGraph,
      title: `${slicedTitle} - ${SHORT_NAME}`,
      description: slicedDescription,
      images: `https://soujpa.in/start/${id}/${id}_0.avif`,
      url: `/manga/${id}`,
    },
    alternates: {
      canonical: `/manga/${id}`,
      languages: { ko: `/manga/${id}` },
    },
  }
}

export async function generateStaticParams() {
  const kHentaiIds = await KHentaiClient.getInstance()
    .searchKoreanMangas()
    .then((mangas) => mangas.map((manga) => String(manga.id)))
    .catch(() => [])

  return kHentaiIds.map((id) => ({ id }))
}

export default async function Page({ params }: PageProps<'/manga/[id]'>) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const manga = await getManga(id)

  return (
    <main>
      <MangaViewer id={id} initialManga={manga} />
    </main>
  )
}

const getManga = cache(async (id: number) => {
  return LitomiClient.getInstance()
    .getManga(id)
    .catch(() => null)
})
