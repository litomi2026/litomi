'use client'

import dynamic from 'next/dynamic'

import { useMangaQuery } from '@/app/manga/[id]/useMangaQuery'
import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { Manga, MangaError } from '@/types/manga'

import useClientSideMetadata from './useClientSideMetadata'

const NotFound = dynamic(() => import('./not-found'))

type Props = {
  id: number
  initialManga?: Manga
}

export default function MangaViewer({ id, initialManga }: Readonly<Props>) {
  const { data } = useMangaQuery(id, initialManga)
  const manga = prepareManga(data, initialManga)

  // NOTE: Vercel Fluid Active CPU 비용을 줄이기 위해
  useClientSideMetadata(manga ?? {})

  if (!manga) {
    return <NotFound />
  }

  return <ImageViewer manga={manga} />
}

function prepareManga(data: Manga | MangaError | undefined, initialManga: Manga | undefined): Manga | null | undefined {
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
    }
  }

  return initialManga ? { ...initialManga, ...data } : data
}
