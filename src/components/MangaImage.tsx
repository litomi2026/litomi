'use client'

import { ComponentPropsWithRef, useState } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5

interface Props extends ComponentPropsWithRef<'img'> {
  imageIndex?: number
  mangaId?: number
  src?: string
}

export default function MangaImage({ imageIndex = 0, mangaId, src = '/', ...props }: Props) {
  const [imageVarientIndex, setImageVarientIndex] = useState(0)
  const imageVarients = [src, ...getFallbacks(mangaId, imageIndex)]
  const currentSrc = imageVarientIndex === -1 ? src : imageVarients[imageVarientIndex]
  const hasMoreFallbacks = imageVarientIndex < imageVarients.length

  return (
    <img
      alt={`manga-image-${imageIndex + 1}`}
      fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
      onError={() => hasMoreFallbacks && setImageVarientIndex((prev) => prev + 1)}
      src={currentSrc}
      {...props}
      draggable={false}
    />
  )
}

function getFallbacks(mangaId: number | undefined, imageIndex: number): string[] {
  if (mangaId === undefined) {
    return []
  }

  return [
    `https://soujpa.in/start/${mangaId}/${mangaId}_${imageIndex}.avif`,
    `https://soujpa.in/start/${mangaId}/${mangaId}_${imageIndex}.webp`,
    `https://cdn.hentkor.net/pages/${mangaId}/${imageIndex + 1}.avif`,
  ]
}
