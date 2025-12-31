'use client'

import { ComponentPropsWithRef, useEffect, useState } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5

interface Props extends ComponentPropsWithRef<'img'> {
  imageIndex?: number
  mangaId: number
  src?: string
}

export default function MangaImage({ imageIndex = 0, mangaId, src = '/image/thumbnail.avif', ...props }: Props) {
  const [imageVariantIndex, setImageVariantIndex] = useState(0)
  const imageVariants = [src, ...getFallbacks(mangaId, imageIndex)]
  const currentSrc = imageVariants[imageVariantIndex] ?? src
  const hasMoreFallbacks = imageVariantIndex + 1 < imageVariants.length

  // NOTE: 이미지가 바뀌면(작품/페이지/원본 URL 변경) fallback 상태를 초기화해야 정상적으로 교체돼요.
  useEffect(() => {
    setImageVariantIndex(0)
  }, [imageIndex, mangaId, src])

  return (
    <img
      alt={`manga-image-${imageIndex + 1}`}
      draggable={false}
      fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
      onError={() => hasMoreFallbacks && setImageVariantIndex((prev) => prev + 1)}
      src={currentSrc}
      {...props}
    />
  )
}

function getFallbacks(mangaId: number, imageIndex: number): string[] {
  return [
    `https://soujpa.in/start/${mangaId}/${mangaId}_${imageIndex}.avif`,
    `https://soujpa.in/start/${mangaId}/${mangaId}_${imageIndex}.webp`,
    `https://cdn.hentkor.net/pages/${mangaId}/${imageIndex + 1}.avif`,
    '/image/fallback.svg',
  ]
}
