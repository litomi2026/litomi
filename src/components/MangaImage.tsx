'use client'

import type { ComponentPropsWithRef, SyntheticEvent } from 'react'

import { useEffect, useState } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5
const FALLBACK_IMAGE_URL = '/image/fallback.svg'
const THUMBNAIL_PLACEHOLDER_URL = '/image/thumbnail.avif'

interface Props extends ComponentPropsWithRef<'img'> {
  imageIndex?: number
  kind?: 'original' | 'thumbnail'
  mangaId: number
  src?: string
}

export default function MangaImage({ imageIndex = 0, mangaId, src = '', kind = 'original', onError, ...props }: Props) {
  const [sourceIndex, setSourceIndex] = useState(0)
  const hasSrc = Boolean(src)
  const isPlaceholderOnly = !hasSrc && mangaId === 0
  const maxIndex = isPlaceholderOnly ? 0 : getMaxSourceIndex(kind, hasSrc)

  function resolveSrc(index: number): string {
    if (isPlaceholderOnly) {
      return THUMBNAIL_PLACEHOLDER_URL
    }
    if (hasSrc && index === 0) {
      return src
    }
    return resolveFallbackSrc(kind, mangaId, index - (hasSrc ? 1 : 0))
  }

  const currentSrc = resolveSrc(sourceIndex)

  function handleError(event: SyntheticEvent<HTMLImageElement, Event>) {
    onError?.(event)

    // NOTE: Civitai 등 외부 이미지에서 fallback 로직을 실행하면 의도치 않은 이미지가 보일 수 있어요.
    if (mangaId === 0) {
      return
    }

    setSourceIndex((prev) => {
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

function buildCoverThumbnailUrl(mangaId: number): string {
  return `https://cdn.imagedeliveries.com/${mangaId}/thumbnails/cover.webp`
}

function buildHentkorFirstPageUrl(mangaId: number): string {
  return `https://cdn.hentkor.net/pages/${mangaId}/1.avif`
}

function buildSoujpaStartUrl(mangaId: number, ext: 'avif' | 'webp'): string {
  return `https://soujpa.in/start/${mangaId}/${mangaId}_0.${ext}`
}

function getMaxSourceIndex(kind: NonNullable<Props['kind']>, hasSrc: boolean): number {
  const fallbackCount = kind === 'thumbnail' ? 5 : 4
  return hasSrc ? fallbackCount : fallbackCount - 1
}

function resolveFallbackSrc(kind: NonNullable<Props['kind']>, mangaId: number, fallbackIndex: number): string {
  if (kind === 'thumbnail') {
    switch (fallbackIndex) {
      case 0:
        return buildCoverThumbnailUrl(mangaId)
      case 1:
        return buildSoujpaStartUrl(mangaId, 'avif')
      case 2:
        return buildSoujpaStartUrl(mangaId, 'webp')
      case 3:
        return buildHentkorFirstPageUrl(mangaId)
      default:
        return FALLBACK_IMAGE_URL
    }
  }

  switch (fallbackIndex) {
    case 0:
      return buildSoujpaStartUrl(mangaId, 'avif')
    case 1:
      return buildSoujpaStartUrl(mangaId, 'webp')
    case 2:
      return buildHentkorFirstPageUrl(mangaId)
    default:
      return FALLBACK_IMAGE_URL
  }
}
