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

  const widthPageViewStyle = {
    double: '[&_img]:w-1/2',
    single: '[&_img]:w-full',
  }[pageView]

  const screenFitStyle = {
    width: `overflow-y-auto overscroll-none [&_li]:mx-auto [&_li]:w-fit [&_li]:max-w-full [&_li]:first:h-full [&_img]:my-auto [&_img]:max-w-fit [&_img]:h-auto ${widthPageViewStyle}`,
    height:
      'overflow-x-auto overscroll-none [&_li]:items-center [&_li]:mx-auto [&_li]:w-fit [&_li]:first:h-full [&_img]:max-w-fit [&_img]:h-auto [&_img]:max-h-dvh',
    all: '[&_li]:items-center [&_li]:mx-auto [&_img]:min-w-0 [&_li]:w-fit [&_li]:h-full [&_img]:max-h-dvh',
  }[screenFit]

  return (
    <ul
      className={`h-dvh select-none [&_li]:flex [&_img]:border [&_img]:border-gray-800 [&_img]:aria-hidden:sr-only ${screenFitStyle}`}
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
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: image.name })}
              />
            )}
            {pageView === 'double' && offset === 0 && nextImage && (
              <img
                alt={`manga-image-${nextImageIndex + 1}`}
                draggable={false}
                fetchPriority={nextImageIndex < 5 ? 'high' : 'low'}
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
