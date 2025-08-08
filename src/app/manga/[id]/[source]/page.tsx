import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import type { PageProps } from '@/types/nextjs'

import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { ERROR_MANGA } from '@/constants/json'
import { CANONICAL_URL } from '@/constants/url'
import { HiyobiClient } from '@/crawler/hiyobi'
import { KHentaiClient } from '@/crawler/k-hentai'
import { getImageSrc } from '@/utils/manga'
import { SourceParam } from '@/utils/param'

import { mangaSchema } from './schema'

export const revalidate = 28800 // 8 hours

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const validation = mangaSchema.safeParse(params)

  if (!validation.success) {
    notFound()
  }

  const { id, source } = validation.data
  const manga = await getManga({ source, id })

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
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id, source } = validation.data
  const manga = await getManga({ source, id })

  if (!manga) {
    notFound()
  }

  return (
    <main>
      <ImageViewer manga={manga} source={source} />
    </main>
  )
}

async function getManga({ source, id }: { source: SourceParam; id: number }) {
  try {
    if (source === SourceParam.HIYOBI) {
      const hiyobiClient = HiyobiClient.getInstance()

      const [mangaFromHiyobi, mangaImages] = await Promise.all([
        hiyobiClient.fetchManga(id),
        hiyobiClient.fetchMangaImages(id),
      ])

      return {
        ...(mangaFromHiyobi ?? { id, title: '만화 정보가 없어요' }),
        images: mangaImages,
        cdn: 'hiyobi',
      }
    } else if (source === SourceParam.K_HENTAI) {
      return await KHentaiClient.getInstance().fetchManga(id)
    } else if (source === SourceParam.HARPI) {
      return ERROR_MANGA
    }
  } catch (error) {
    return { ...ERROR_MANGA, id, title: JSON.stringify(error) ?? '오류가 발생했어요' }
  }
}
