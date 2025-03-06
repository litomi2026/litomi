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
    <ul className="select-none [&_li]:flex [&_li]:justify-center [&_li]:gap-1 [&_img]:h-dvh [&_img]:min-w-0 [&_img]:object-contain [&_img]:select-none [&_img]:aria-hidden:sr-only">
      {Array.from({ length: 10 }).map((_, offset) => {
        const imageIndex = currentIndex + offset
        const nextImageIndex = imageIndex + 1

        return (
          <li key={offset} onClick={onImageClick}>
            {0 <= imageIndex && imageIndex < images.length && (
              <img
                alt={`manga-image-${imageIndex + 1}`}
                aria-hidden={offset !== 0}
                fetchPriority={imageIndex < 5 ? 'high' : undefined}
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: images[imageIndex].name })}
              />
            )}
            {isDoublePage && offset === 0 && 0 <= nextImageIndex && nextImageIndex < images.length && (
              <img
                alt={`manga-image-${nextImageIndex + 1}`}
                fetchPriority={nextImageIndex < 5 ? 'high' : undefined}
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: images[nextImageIndex].name })}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
