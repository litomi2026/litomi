'use client'

import { ComponentPropsWithRef, useState } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5

interface Props extends ComponentPropsWithRef<'img'> {
  imageIndex?: number
  src?: string
}

export default function MangaImage({ imageIndex = 0, src, ...props }: Props) {
  const [fallbackMap, setFallbackMap] = useState(new Map<number, string>())

  return (
    <img
      alt={`manga-image-${imageIndex + 1}`}
      fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
      onError={() => setFallbackMap((prev) => new Map(prev).set(imageIndex, src?.replace(/\.avif$/, '.webp') ?? ''))} // NOTE: 간혹 avif 이미지가 404인 경우가 있어서
      src={fallbackMap.get(imageIndex) || src}
      {...props}
      draggable={false}
    />
  )
}
