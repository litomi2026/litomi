'use client'

import type { ComponentPropsWithRef, SyntheticEvent } from 'react'

import { useEffect, useState } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5
const FALLBACK_IMAGE_URL = '/image/fallback.svg'

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
  const currentSrc = resolveSrc(sourceIndex)

  function resolveSrc(index: number): string {
    if (src && index === 0) {
      return src
    }
    if (mangaId === 0) {
      return FALLBACK_IMAGE_URL
    }
    return resolveFallbackSrc(kind, mangaId, index - (src ? 1 : 0), imageIndex)
  }

  function handleError(event: SyntheticEvent<HTMLImageElement, Event>) {
    onError?.(event)

    if (mangaId === 0) {
      return
    }

    setSourceIndex((prev) => {
      const fallbackCount = kind === 'thumbnail' ? 6 : 4
      const maxIndex = src ? fallbackCount : fallbackCount - 1
      const current = resolveSrc(prev)

      for (let next = prev + 1; next <= maxIndex; next += 1) {
        const candidate = resolveSrc(next)
        if (candidate !== current) {
          return next
        }
      }

      return prev
    })
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
      src={currentSrc}
      {...props}
    />
  )
}

function buildHentkorFirstPageURL(mangaId: number) {
  return `https://cdn.hentkor.net/pages/${mangaId}/1.avif`
}

function buildImageDeliveriesCoverThumbnailURL(mangaId: number) {
  return `https://cdn.imagedeliveries.com/${mangaId}/thumbnails/cover.webp`
}

function buildImageDeliveriesNPageThumbnailURL(mangaId: number, imageIndex: number) {
  return `https://cdn.imagedeliveries.com/${mangaId}/thumbnails/${imageIndex}.webp`
}

function buildSoujpaFirstPageURL(mangaId: number, ext: 'avif' | 'webp') {
  return `https://soujpa.in/start/${mangaId}/${mangaId}_0.${ext}`
}

function resolveFallbackSrc(
  kind: NonNullable<Props['kind']>,
  mangaId: number,
  fallbackIndex: number,
  imageIndex: number,
) {
  if (kind === 'thumbnail') {
    switch (fallbackIndex) {
      case 0:
        return buildImageDeliveriesNPageThumbnailURL(mangaId, imageIndex + 1)
      case 1:
        return buildImageDeliveriesCoverThumbnailURL(mangaId)
      case 2:
        return buildSoujpaFirstPageURL(mangaId, 'avif')
      case 3:
        return buildSoujpaFirstPageURL(mangaId, 'webp')
      case 4:
        return buildHentkorFirstPageURL(mangaId)
      default:
        return FALLBACK_IMAGE_URL
    }
  }

  switch (fallbackIndex) {
    case 0:
      return buildSoujpaFirstPageURL(mangaId, 'avif')
    case 1:
      return buildSoujpaFirstPageURL(mangaId, 'webp')
    case 2:
      return buildHentkorFirstPageURL(mangaId)
    default:
      return FALLBACK_IMAGE_URL
  }
}
