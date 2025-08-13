import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'

import type { PageProps } from '@/types/nextjs'

import { getMangaFromMultipleSources } from '@/common/manga'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { CANONICAL_URL } from '@/constants/url'
import { KHentaiClient } from '@/crawler/k-hentai'
import { getImageSource } from '@/utils/manga'

import MangaViewer from './MangaViewer'
import { mangaSchema } from './schema'

export const dynamic = 'error'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // cacheLife('days')
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const manga = await getCachedManga(id)

  if (!manga) {
    notFound()
  }

  const { title, description, images, origin } = manga

  return {
    alternates: {
      canonical: `${CANONICAL_URL}/manga/${id}`,
      languages: { ko: `${CANONICAL_URL}/manga/${id}` },
    },
    title: `${title} - ${SHORT_NAME}`,
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
    .then((mangas) => mangas?.map((manga) => String(manga.id)) ?? [])
    .catch(() => [] as string[])

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

// TODO: 추후 'use cache' 로 변경하면서 getCachedManga 함수 제거하기
const getCachedManga = unstable_cache(
  async (id: number) => getMangaFromMultipleSources(id, 86400),
  ['getCachedManga'],
  { revalidate: 86400 },
)
