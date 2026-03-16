'use client'

import type { ComponentPropsWithRef, SyntheticEvent } from 'react'

import { useEffect, useState } from 'react'

import { env } from '@/env/client'
import {
  createCoverThumbnailURL,
  createEquivalentMangaImageSourceURLs,
  createFirstPageOriginalFallbackURLs,
  createMangaImageProxyRequestURL,
} from '@/utils/image-proxy'

const INITIAL_DISPLAYED_IMAGE = 5
const FALLBACK_IMAGE_URL = '/image/fallback.svg'
const { NEXT_PUBLIC_CORS_PROXY_URL } = env

interface Props extends ComponentPropsWithRef<'img'> {
  imageIndex?: number
  kind?: 'original' | 'thumbnail'
  /**
   * @note 외부 이미지(mangaId=0)는 내부 fallback 체인을 돌리지 않아요.
   */
  mangaId: number
  src?: string
}

export default function MangaImage({ imageIndex = 0, mangaId, src = '', kind = 'original', onError, ...props }: Props) {
  const [sourceIndex, setSourceIndex] = useState(0)
  const sources = resolveSources({ imageIndex, kind, mangaId, src })

  function handleError(event: SyntheticEvent<HTMLImageElement, Event>) {
    onError?.(event)

    if (mangaId === 0) {
      return
    }

    setSourceIndex((prev) => Math.min(prev + 1, sources.length - 1))
  }

  // NOTE: 이미지가 바뀌면(작품/페이지/원본 URL 변경) fallback 상태를 초기화해야 정상적으로 교체돼요
  useEffect(() => {
    setSourceIndex(0)
  }, [imageIndex, kind, mangaId, src])

  return (
    <img
      alt={`manga-image-${imageIndex + 1}`}
      draggable={false}
      fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
      onError={handleError}
      src={sources[sourceIndex]}
      {...props}
    />
  )
}

function resolveSources({
  imageIndex,
  kind,
  mangaId,
  src,
}: {
  imageIndex: number
  kind: NonNullable<Props['kind']>
  mangaId: number
  src: string
}): string[] {
  const page = imageIndex + 1
  const resolvedSources: string[] = []

  if (src) {
    resolvedSources.push(src)
  }

  if (mangaId === 0) {
    resolvedSources.push(FALLBACK_IMAGE_URL)
    return resolvedSources
  }

  const semanticProbeURL = createMangaImageProxyRequestURL({
    proxyOrigin: NEXT_PUBLIC_CORS_PROXY_URL,
    mangaId,
    page,
    variant: kind,
  })

  const semanticSourceURLs = createEquivalentMangaImageSourceURLs({
    mangaId,
    page,
    variant: kind,
  })

  const semanticMaterializeURLs = semanticSourceURLs.map((sourceURL) =>
    createMangaImageProxyRequestURL({
      proxyOrigin: NEXT_PUBLIC_CORS_PROXY_URL,
      sourceURL,
      mangaId,
      page,
      variant: kind,
    }),
  )

  resolvedSources.push(semanticProbeURL, ...semanticMaterializeURLs)

  if (kind === 'thumbnail') {
    resolvedSources.push(createCoverThumbnailURL(mangaId), ...createFirstPageOriginalFallbackURLs(mangaId))
  }

  resolvedSources.push(FALLBACK_IMAGE_URL)

  return Array.from(new Set(resolvedSources.filter(Boolean)))
}
