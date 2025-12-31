'use client'

import { ComponentPropsWithRef, useEffect, useState } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5
const FALLBACK_IMAGE_URL = '/image/fallback.svg'

type FallbackBuilder = (mangaId: number, imageIndex: number) => string

const PAGE_FALLBACK_BUILDERS: readonly FallbackBuilder[] = [
  (mangaId, imageIndex) => `https://soujpa.in/start/${mangaId}/${mangaId}_${imageIndex}.avif`,
  (mangaId, imageIndex) => `https://soujpa.in/start/${mangaId}/${mangaId}_${imageIndex}.webp`,
  (mangaId, imageIndex) => `https://cdn.hentkor.net/pages/${mangaId}/${imageIndex + 1}.avif`,
  () => FALLBACK_IMAGE_URL,
]

interface Props extends ComponentPropsWithRef<'img'> {
  imageIndex?: number
  kind?: 'original' | 'thumbnail'
  mangaId: number
  src?: string
}

export default function MangaImage({
  imageIndex = 0,
  mangaId,
  src = '/image/thumbnail.avif',
  kind = 'original',
  ...props
}: Props) {
  const [imageVariantIndex, setImageVariantIndex] = useState(0)
  const isThumbnail = kind === 'thumbnail'
  const maxVariantIndex = PAGE_FALLBACK_BUILDERS.length + (isThumbnail ? 1 : 0)

  function resolveSrc(variantIndex: number): string {
    if (variantIndex <= 0) {
      return src
    }

    if (isThumbnail) {
      if (variantIndex === 1) {
        return buildCoverThumbnailUrl(mangaId)
      }

      const builder = PAGE_FALLBACK_BUILDERS[variantIndex - 2]
      return builder ? builder(mangaId, imageIndex) : src
    }

    const builder = PAGE_FALLBACK_BUILDERS[variantIndex - 1]
    return builder ? builder(mangaId, imageIndex) : src
  }

  const currentSrc = resolveSrc(imageVariantIndex)

  function handleError() {
    setImageVariantIndex((prev) => {
      const current = resolveSrc(prev)

      for (let next = prev + 1; next <= maxVariantIndex; next += 1) {
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
    setImageVariantIndex(0)
  }, [imageIndex, mangaId, src])

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
