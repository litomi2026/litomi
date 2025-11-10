import { ComponentPropsWithRef } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5

interface Props extends ComponentPropsWithRef<'img'> {
  imageIndex?: number
}

export default function MangaImage({ imageIndex = 0, ...props }: Props) {
  return (
    <img
      alt={`manga-image-${imageIndex + 1}`}
      fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
      {...props}
      draggable={false}
    />
  )
}
