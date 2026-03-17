'use client'

import type { ComponentPropsWithRef, SyntheticEvent } from 'react'

import { useEffect, useState } from 'react'

import { createEquivalentMangaImageSourceURLs, createMangaImageProxyRequestURL } from '@/utils/image-proxy'

const INITIAL_DISPLAYED_IMAGE = 5
const FALLBACK_IMAGE_URL = '/image/fallback.svg'

interface Props extends ComponentPropsWithRef<'img'> {
  imageIndex?: number
  /**
   * @note 외부 이미지(mangaId=0)는 내부 fallback 체인을 돌리지 않아요.
   */
  mangaId: number
  src?: string
  variant?: 'original' | 'thumbnail'
}

export default function MangaImage({
  imageIndex = 0,
  mangaId,
  src = '',
  variant = 'original',
  onError,
  ...props
}: Props) {
  const [sourceIndex, setSourceIndex] = useState(0)
  const sources = resolveSources({ imageIndex, variant, mangaId, src })

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
  }, [imageIndex, variant, mangaId, src])

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
  variant,
  mangaId,
  src,
}: {
  imageIndex: number
  variant: NonNullable<Props['variant']>
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
    mangaId,
    page,
    variant,
  })

  const semanticSourceURLs = createEquivalentMangaImageSourceURLs({
    mangaId,
    page,
    variant,
  })

  resolvedSources.push(semanticProbeURL, ...semanticSourceURLs)

  if (variant === 'thumbnail') {
    const originalFallbackSourceURLs = createEquivalentMangaImageSourceURLs({
      mangaId,
      page,
      variant: 'original',
    })

    resolvedSources.push(...originalFallbackSourceURLs)
  }

  resolvedSources.push(FALLBACK_IMAGE_URL)

  return Array.from(new Set(resolvedSources.filter(Boolean)))
}
