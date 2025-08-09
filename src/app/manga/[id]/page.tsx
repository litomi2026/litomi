import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import type { PageProps } from '@/types/nextjs'

import { getMangaFromMultipleSources } from '@/common/manga'
import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { CANONICAL_URL } from '@/constants/url'
import { HiyobiClient } from '@/crawler/hiyobi'
import { getImageSource } from '@/utils/manga'
import { SourceParam } from '@/utils/param'

import { mangaSchema } from './schema'

export const revalidate = 28800 // 8 hours
export const dynamic = 'error'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const manga = await getMangaFromMultipleSources(id)

  if (!manga) {
    notFound()
  }

  const { title, images, origin } = manga

  return {
    alternates: {
      canonical: `${CANONICAL_URL}/manga/${id}`,
      languages: { ko: `${CANONICAL_URL}/manga/${id}` },
    },
    title: `${title} - ${SHORT_NAME}`,
    openGraph: {
      ...defaultOpenGraph,
      images: images.slice(0, 3).map((imageURL) => getImageSource({ imageURL, origin })),
    },
  }
}

export async function generateStaticParams() {
  const hiyobiIds = await HiyobiClient.getInstance()
    .fetchMangas(1)
    .then((mangas) => mangas?.map((manga) => String(manga.id)) ?? [])
    .catch(() => [] as string[])
  const params: Record<string, unknown>[] = []
  const idMap: Record<string, string[]> = {
    [SourceParam.HIYOBI]: hiyobiIds?.slice(0, 5),
  }
  for (const source of Object.keys(idMap)) {
    for (const id of idMap[source]) {
      params.push({ id, source })
    }
  }
  return params
}

export default async function Page({ params }: PageProps) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const manga = await getMangaFromMultipleSources(id)

  if (!manga) {
    notFound()
  }

  return (
    <main>
      <ImageViewer manga={manga} />
    </main>
  )
}
