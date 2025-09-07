import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { KHentaiClient } from '@/crawler/k-hentai'
import { LitomiClient } from '@/crawler/litomi'
import { Manga } from '@/types/manga'

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

  return {
    title: `${manga?.title ?? '작품'} - ${SHORT_NAME}`,
    description: manga?.description,
    openGraph: {
      ...defaultOpenGraph,
      title: `${manga?.title ?? '작품'} - ${SHORT_NAME}`,
      description: manga?.description,
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
      <MangaViewer id={id} initialData={manga} />
    </main>
  )
}

const getManga = cache(async (id: number): Promise<Manga | null> => {
  const litomiClient = LitomiClient.getInstance()
  return litomiClient.fetchManga(id)
})
