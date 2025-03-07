'use client'

import { getImageSrc } from '@/constants/url'
import { usePageViewStore } from '@/store/controller/pageView'
import { useScreenFitStore } from '@/store/controller/screenFit'
import { Manga } from '@/types/manga'

type Props = {
  manga: Manga
  currentIndex: number
  onImageClick: () => void
}

export default function TouchViewer({ manga, currentIndex, onImageClick }: Props) {
  const { images, cdn, id } = manga
  const pageView = usePageViewStore((state) => state.pageView)
  const screenFit = useScreenFitStore((state) => state.screenFit)

  const screenFitStyle = {
    width: 'h-dvh overflow-y-auto flex [&_img]:min-w-0 ',
    height: 'overflow-x-auto [&_li]:w-fit [&_img]:min-w-fit [&_img]:max-w-fit [&_img]:h-dvh',
    all: 'h-dvh [&_li]:w-fit [&_li]:h-full [&_li]:items-center [&_img]:min-w-0 [&_img]:w-fit [&_img]:max-h-dvh',
  }[screenFit]

  return (
    <ul
      className={`select-none pb-safe [&_li]:flex [&_li]:m-auto [&_img]:select-none [&_img]:border [&_img]:border-gray-800 [&_img]:aria-hidden:sr-only ${screenFitStyle}`}
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
                draggable={false}
                fetchPriority={imageIndex < 5 ? 'high' : 'low'}
                height={image.height ?? 1536}
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: image.name })}
                width={image.width ?? 1536}
              />
            )}
            {pageView === 'double' && offset === 0 && nextImage && (
              <img
                alt={`manga-image-${nextImageIndex + 1}`}
                draggable={false}
                fetchPriority={nextImageIndex < 5 ? 'high' : 'low'}
                height={nextImage.height ?? 1536}
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: nextImage.name })}
                width={nextImage.width ?? 1536}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
