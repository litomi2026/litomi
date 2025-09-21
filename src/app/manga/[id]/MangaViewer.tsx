'use client'

import dynamic from 'next/dynamic'

import { useMangaQuery } from '@/app/manga/[id]/useMangaQuery'
import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { Manga, MangaError } from '@/types/manga'
import { getImageSource } from '@/utils/manga'

import usePageMetadata from './usePageMetadata'

const NotFound = dynamic(() => import('./not-found'))

type Props = {
  id: number
  initialManga?: Manga | null
}

export default function MangaViewer({ id, initialManga }: Readonly<Props>) {
  const { data } = useMangaQuery(id, initialManga)
  const manga = prepareManga(data, initialManga)
  const metadata = prepareMetadata(manga)

  // NOTE: Vercel Fluid Active CPU 비용을 줄이기 위해
  usePageMetadata(metadata)

  if (!manga) {
    return <NotFound />
  }

  return <ImageViewer manga={manga} />
}

function prepareManga(
  data: Manga | MangaError | undefined,
  initialManga: Manga | null | undefined,
): Manga | null | undefined {
  if (!data && !initialManga) {
    return null
  }

  if (data?.images.length === 0) {
    return initialManga ?? data
  }

  const isError = data && 'isError' in data && data.isError

  if (isError) {
    return {
      ...initialManga,
      id: data.id,
      title: initialManga?.title || data.title,
      images: data.images,
      origin: data.origin,
    }
  }

  return initialManga ? { ...initialManga, ...data } : data
}

function prepareMetadata(manga: Manga | null | undefined) {
  if (!manga || manga.images.length === 0) {
    return {}
  }

  const parts: string[] = []

  if (manga.artists && manga.artists.length > 0) {
    const artistNames = manga.artists
      .slice(0, 3)
      .map((a) => a.label)
      .join(', ')
    parts.push(`작가: ${artistNames}`)
  }

  if (manga.series && manga.series.length > 0) {
    const seriesNames = manga.series
      .slice(0, 2)
      .map((s) => s.label)
      .join(', ')
    parts.push(`시리즈: ${seriesNames}`)
  }

  if (manga.characters && manga.characters.length > 0) {
    const characterNames = manga.characters
      .slice(0, 3)
      .map((c) => c.label)
      .join(', ')
    parts.push(`캐릭터: ${characterNames}`)
  }

  if (manga.tags && manga.tags.length > 0) {
    const tagNames = manga.tags
      .slice(0, 5)
      .map((t) => t.label)
      .join(', ')
    parts.push(`태그: ${tagNames}`)
  }

  if (manga.type) {
    parts.push(`종류: ${manga.type}`)
  }

  if (manga.languages && manga.languages.length > 0) {
    const languages = manga.languages.map((l) => l.label).join(', ')
    parts.push(`언어: ${languages}`)
  }

  if (manga.count) {
    parts.push(`${manga.count} 페이지`)
  }

  const description = manga.description || parts.join(' • ')

  return {
    title: manga.title,
    description,
    image: getImageSource({
      imageURL: manga.images[0],
      origin: manga.origin,
    }),
  }
}
