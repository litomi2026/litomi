import { getImageSrc } from '@/constants/url'
import { Manga } from '@/types/manga'

type Props = {
  manga: Manga
  isDoublePage: boolean
  currentIndex: number
  onImageClick: () => void
}

export default function TouchViewer({ manga, isDoublePage, currentIndex, onImageClick }: Props) {
  const { images, cdn, id } = manga

  return (
    <ul
      className="select-none pb-safe h-dvh [&_li]:h-full [&_li]:flex [&_li]:justify-center [&_li]:items-center [&_img]:min-w-0 [&_img]:max-h-full [&_img]:object-contain [&_img]:select-none [&_img]:border [&_img]:border-gray-800 [&_img]:aria-hidden:sr-only"
      onClick={onImageClick}
    >
      {Array.from({ length: 10 }).map((_, offset) => {
        const imageIndex = currentIndex + offset
        const nextImageIndex = imageIndex + 1
        const image = images[imageIndex]
        const nextImage = images[nextImageIndex]

        return (
          <li key={offset}>
            {image && (
              <img
                alt={`manga-image-${imageIndex + 1}`}
                aria-hidden={offset !== 0}
                fetchPriority={imageIndex < 5 ? 'high' : undefined}
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: image.name })}
              />
            )}
            {isDoublePage && offset === 0 && nextImage && (
              <img
                alt={`manga-image-${nextImageIndex + 1}`}
                fetchPriority={nextImageIndex < 5 ? 'high' : undefined}
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: nextImage.name })}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
