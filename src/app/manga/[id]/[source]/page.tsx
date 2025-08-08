import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import type { PageProps } from '@/types/nextjs'

import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { CANONICAL_URL } from '@/constants/url'
import { HiyobiClient } from '@/crawler/hiyobi'
import { KHentaiClient } from '@/crawler/k-hentai'
import { harpiMangas } from '@/database/harpi'
import { getImageSrc } from '@/utils/manga'
import { SourceParam, validateId, validateSource } from '@/utils/param'

import { FALLBACK_IMAGE_URL } from './constants'

export const revalidate = 28800 // 8 hours

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, source } = await params
  const idNumber = validateId(id)
  const sourceString = validateSource(source)

  if (!idNumber || !sourceString) {
    notFound()
  }

  const manga = await getManga({ source: sourceString, id: idNumber })

  if (!manga) {
    notFound()
  }

  const { title, images, cdn } = manga

  return {
    alternates: {
      canonical: `${CANONICAL_URL}/manga/${id}`,
      languages: { ko: `${CANONICAL_URL}/manga/${id}` },
    },
    title: `${title} - ${SHORT_NAME}`,
    openGraph: {
      ...defaultOpenGraph,
      images: images.slice(0, 3).map((path) => getImageSrc({ path, cdn, id: +id })),
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
  const { id, source } = await params
  const idNumber = validateId(id)
  const sourceString = validateSource(source)

  if (!idNumber || !sourceString) {
    notFound()
  }

  const manga = await getManga({ source: sourceString, id: idNumber })

  if (!manga) {
    notFound()
  }

  return (
    <main>
      <ImageViewer manga={manga} source={sourceString} />
    </main>
  )
}

async function getManga({ source, id }: { source: SourceParam; id: number }) {
  if (source === SourceParam.HIYOBI) {
    const hiyobiClient = HiyobiClient.getInstance()

    const [mangaFromHiyobi, mangaImages] = await Promise.all([
      hiyobiClient.fetchManga(id).catch(() => ({ id, title: '오류가 발생했어요', images: [] })),
      hiyobiClient.fetchMangaImages(id).catch(() => [FALLBACK_IMAGE_URL]),
    ])

    return {
      ...(mangaFromHiyobi ?? { id, title: '만화 정보가 없어요' }),
      id,
      images: mangaImages,
      cdn: 'k-hentai',
    }
  } else if (source === SourceParam.K_HENTAI) {
    return await KHentaiClient.getInstance().fetchManga(id)
  } else if (source === SourceParam.HARPI) {
    return harpiMangas[id]
  }
}
