import { CDN } from '@/constants/url'
import { Manga } from '@/types/manga'
import { ImgHTMLAttributes } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5

type Params = {
  cdn?: string
  id: number
  name: string
}

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  manga: Manga
  imageIndex: number
}

export default function MangaImage({ manga, imageIndex, ...props }: Props) {
  const { images, cdn, id } = manga
  const image = images[imageIndex]

  return (
    image && (
      <img
        alt={`manga-image-${imageIndex + 1}`}
        draggable={false}
        fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : 'low'}
        referrerPolicy="same-origin"
        src={getImageSrc({ cdn, id, name: image.name })}
        {...props}
      />
    )
  )
}

function getImageSrc({ cdn, id, name }: Params) {
  switch (cdn) {
    case 'HARPI':
      return `${CDN.HARPI}/${name}`
    case 'HASHA':
    default:
      return `${CDN.HASHA}/${id}/${name}`
  }
}
