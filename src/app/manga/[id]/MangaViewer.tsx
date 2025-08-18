'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'

import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { QueryKeys } from '@/constants/query'

const NotFound = dynamic(() => import('./not-found'))

type Props = {
  id: number
}

export default function MangaViewer({ id }: Readonly<Props>) {
  const { data } = useQuery({
    queryKey: QueryKeys.manga(id),
    queryFn: () => fetchManga(id),
    placeholderData: () => ({ id, title: '불러오는 중', images: [] }),
  })

  if (!data) {
    return <NotFound />
  }

  return <ImageViewer manga={data} />
}

async function fetchManga(id: number) {
  const res = await fetch(`/api/proxy/manga/${id}`)
  return res.ok ? res.json() : null
}
