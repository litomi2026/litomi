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
}

export default function MangaViewer({ id }: Readonly<Props>) {
  const { data: manga } = useQuery({
    queryKey: QueryKeys.manga(id),
    queryFn: () => fetchManga(id),
    placeholderData: () => ({ id, title: '불러오는 중', images: [] }),
  })

  // NOTE: Fluid Active CPU 비용을 줄이기 위해
  useClientSideMetadata({
    title: manga?.title,
    description: manga?.description,
    images: manga?.images.map((image) => getImageSource({ imageURL: image, origin: manga?.origin })).slice(0, 4),
  })

  if (!manga) {
    return <NotFound />
  }

  return <ImageViewer manga={manga} />
}

async function fetchManga(id: number) {
  const response = await fetch(`/api/proxy/manga/${id}`)
  return handleResponseError<Manga>(response)
}
