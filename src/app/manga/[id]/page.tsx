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
  const titleSlice = title?.slice(0, 50)
  const descriptionSlice = description?.slice(0, 160)

  return {
    title: `${titleSlice} - ${SHORT_NAME}`,
    ...(description && { description: descriptionSlice }),
    openGraph: {
      ...defaultOpenGraph,
      title: `${titleSlice} - ${SHORT_NAME}`,
      ...(description && { description: descriptionSlice }),
      images: getImageSource({ imageURL: images[0], origin }),
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
