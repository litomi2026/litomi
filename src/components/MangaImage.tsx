import { ImgHTMLAttributes, memo } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  imageIndex?: number
  imageRef?: (node?: Element | null) => void
}

export default memo(MangaImage)

function MangaImage({ imageIndex = 0, imageRef, src, ...props }: Readonly<Props>) {
  return (
    src && (
      <img
        alt={`manga-image-${imageIndex + 1}`}
        draggable={false}
        fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
        ref={imageRef}
        src={src}
        {...props}
      />
    )
  )
}
