'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'

import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { QueryKeys } from '@/constants/query'
import { Manga } from '@/types/manga'
import { getImageSource } from '@/utils/manga'
import { handleResponseError } from '@/utils/react-query-error'

import useClientSideMetadata from './useClientSideMetadata'

const NotFound = dynamic(() => import('./not-found'))

type Props = {
  id: number
  initialManga?: Manga
}

export default function MangaViewer({ id, initialManga }: Readonly<Props>) {
  const { data: manga } = useQuery({
    queryKey: QueryKeys.manga(id),
    queryFn: () => fetchManga(id),
    placeholderData: { id, title: '불러오는 중', images: [] },
  })

  // NOTE: Vercel Fluid Active CPU 비용을 줄이기 위해
  useClientSideMetadata({
    title: manga?.title,
    description: manga?.description,
    image: manga?.images.map((image) => getImageSource({ imageURL: image, origin: manga?.origin }))[0],
  })

  if (!manga) {
    if (initialManga) {
      return <ImageViewer manga={initialManga} />
    }
    return <NotFound />
  }

  return <ImageViewer manga={manga} />
}

async function fetchManga(id: number) {
  const response = await fetch(`/api/proxy/manga/${id}`)
  return handleResponseError<Manga>(response)
}
