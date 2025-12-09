'use client'

import { ComponentPropsWithRef, useState } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5

interface Props extends ComponentPropsWithRef<'img'> {
  imageIndex?: number
  mangaId?: number
  src?: string
}

export default function MangaImage({ imageIndex = 0, mangaId, src, ...props }: Props) {
  const [fallbackIndex, setFallbackIndex] = useState(-1)
  const fallbacks = getFallbacks(mangaId, imageIndex)
  const currentSrc = fallbackIndex === -1 ? src : fallbacks[fallbackIndex]
  const hasMoreFallbacks = fallbackIndex < fallbacks.length - 1

  return (
    <img
      alt={`manga-image-${imageIndex + 1}`}
      fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
      onError={() => hasMoreFallbacks && setFallbackIndex((prev) => prev + 1)}
      src={currentSrc}
      {...props}
      draggable={false}
    />
  )
}

function getFallbacks(mangaId: number | undefined, imageIndex: number): string[] {
  const fallbacks: string[] = []

  if (mangaId) {
    fallbacks.push(`https://soujpa.in/start/${mangaId}/${mangaId}_${imageIndex}.avif`)
    fallbacks.push(`https://soujpa.in/start/${mangaId}/${mangaId}_${imageIndex}.webp`)
    fallbacks.push(`https://cdn.hentkor.net/pages/${mangaId}/${imageIndex + 1}.avif`)
  }

  return fallbacks
}
