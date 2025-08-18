import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import type { PageProps } from '@/types/nextjs'

import { GETProxyMangaIdResponse } from '@/app/api/proxy/manga/[id]/route'
import { CANONICAL_URL, defaultOpenGraph, SHORT_NAME } from '@/constants'
import { KHentaiClient } from '@/crawler/k-hentai'
import { getImageSource } from '@/utils/manga'

import MangaViewer from './MangaViewer'
import { mangaSchema } from './schema'

export const dynamic = 'error'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const response = await fetch(`${CANONICAL_URL}/api/proxy/manga/${id}`)
  const manga = (await response.json()) as GETProxyMangaIdResponse

  if (!manga) {
    notFound()
  }

  const { title, description, images, origin } = manga

  return {
    title: `${title} - ${SHORT_NAME}`,
    ...(description && { description }),
    openGraph: {
      ...defaultOpenGraph,
      title: `${title} - ${SHORT_NAME}`,
      ...(description && { description }),
      images: images.slice(0, 3).map((imageURL) => getImageSource({ imageURL, origin })),
      url: `${CANONICAL_URL}/manga/${id}`,
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

export default async function Page({ params }: PageProps) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  return (
    <main>
      <MangaViewer id={id} />
    </main>
  )
}
