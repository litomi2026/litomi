'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import ImageViewer from '@/app/manga/[id]/ImageViewer/ImageViewer'
import { QueryKeys } from '@/constants/query'
import { WebtoonEpisode } from '@/crawler/webtoon/types'
import { env } from '@/env/client'
import { Manga } from '@/types/manga'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_EXTERNAL_API_PROXY_URL } = env

type EpisodeQueryParams = {
  provider: string
  domain: string
  path: string
}

export default function EpisodeViewer() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') ?? ''
  const domain = searchParams.get('domain') ?? ''
  const path = searchParams.get('path') ?? ''
  const { data: manga, isLoading, error } = useEpisodeQuery({ provider, domain, path })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (error || !manga) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-2">
        <p className="text-zinc-500">이미지를 불러올 수 없어요</p>
        <p className="text-zinc-600 text-sm">{error?.message}</p>
      </div>
    )
  }

  return <ImageViewer manga={manga} />
}

function createMangaFromEpisode(episode: WebtoonEpisode): Manga {
  return {
    id: 0,
    title: episode.title || '',
    images: episode.images.map((url) => ({
      original: { url },
    })),
  }
}

function useEpisodeQuery({ provider, domain, path }: EpisodeQueryParams) {
  return useQuery({
    queryKey: QueryKeys.webtoonEpisode(provider, domain, path),
    queryFn: async () => {
      const params = new URLSearchParams({ domain, path })
      const url = `${NEXT_PUBLIC_EXTERNAL_API_PROXY_URL}/api/proxy/webtoon/${provider}/episode?${params}`
      const { data } = await fetchWithErrorHandling<WebtoonEpisode>(url)
      return createMangaFromEpisode(data)
    },
    enabled: Boolean(provider && domain && path),
  })
}
