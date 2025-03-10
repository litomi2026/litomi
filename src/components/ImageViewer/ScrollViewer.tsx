'use client'

import { usePageViewStore } from '@/components/ImageViewer/store/pageView'
import { useScreenFitStore } from '@/components/ImageViewer/store/screenFit'
import { type Manga } from '@/types/manga'
import { getSafeAreaBottom } from '@/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Dispatch, memo, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import MangaImage from '../MangaImage'
import { useImageIndexStore } from './store/imageIndex'
import { useVirtualizerStore } from './store/virtualizer'

type Props = {
  manga: Manga
  onClick: () => void
}

type VirtualItemProps = {
  index: number
  manga: Manga
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>
  isError: boolean
  isError2?: boolean
  setImageErrors: Dispatch<SetStateAction<{ errors: boolean[] }>>
}

export default memo(ScrollViewer)

function ScrollViewer({ manga, onClick }: Props) {
  const { images } = manga
  const parentRef = useRef<HTMLDivElement>(null)
  const pageView = usePageViewStore((state) => state.pageView)
  const screenFit = useScreenFitStore((state) => state.screenFit)
  const setVirtualizer = useVirtualizerStore((state) => state.setVirtualizer)
  const isDoublePage = pageView === 'double'
  const rowCount = isDoublePage ? Math.ceil(images.length / 2) : images.length
  const [imageErrors, setImageErrors] = useState({ errors: [] as boolean[] })

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => window.innerHeight, []),
    overscan: 5,
    useAnimationFrameWithResizeObserver: true,
    paddingEnd: getSafeAreaBottom(),
  })

  const virtualItems = virtualizer.getVirtualItems()
  const translateY = virtualItems[0]?.start ?? 0

  useEffect(() => {
    setVirtualizer(virtualizer)
    return () => {
      setVirtualizer(null)
    }
  }, [setVirtualizer, virtualizer])

  const screenFitStyle = {
    width: '[&_li]:justify-center [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:max-h-fit',
    all: '[&_li]:justify-center [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:max-h-dvh',

    // TODO: Fix this
    height:
      '[&_li]:overflow-x-auto [&_li]:overscroll-none [&_li]:mx-auto [&_li]:w-fit [&_li]:max-w-full [&_img]:w-auto [&_img]:max-w-fit [&_img]:h-dvh [&_img]:max-h-fit',
  }[screenFit]

  return (
    <div className="overflow-y-auto overscroll-none contain-strict h-dvh select-none" onClick={onClick} ref={parentRef}>
      <div className="w-full relative" style={{ height: virtualizer.getTotalSize() }}>
        <ul
          className={`absolute top-0 left-0 w-full [&_li]:flex [&_img]:border [&_img]:border-background [&_img]:aria-hidden:w-40 [&_img]:aria-hidden:text-foreground ${screenFitStyle}`}
          style={{ transform: `translateY(${translateY}px)` }}
        >
          {virtualItems.map(({ index, key }) => (
            <VirtualItemMemo
              index={index}
              isError={imageErrors.errors[isDoublePage ? index * 2 : index]}
              isError2={isDoublePage ? imageErrors.errors[(isDoublePage ? index * 2 : index) + 1] : undefined}
              key={key}
              manga={manga}
              setImageErrors={setImageErrors}
              virtualizer={virtualizer}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

const VirtualItemMemo = memo(VirtualItem)

function VirtualItem({ index, manga, virtualizer, isError, isError2, setImageErrors }: VirtualItemProps) {
  const pageView = usePageViewStore((state) => state.pageView)
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)
  const isDoublePage = pageView === 'double'
  const imageIndex = isDoublePage ? index * 2 : index
  const nextImageIndex = imageIndex + 1

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '-50% 0% -50% 0%',
  })

  useEffect(() => {
    if (inView) {
      setImageIndex(imageIndex)
    }
  }, [imageIndex, inView, setImageIndex])

  return (
    <li data-index={index} ref={virtualizer.measureElement}>
      <MangaImage
        aria-hidden={isError}
        imageIndex={imageIndex}
        imageRef={ref}
        manga={manga}
        onError={() =>
          setImageErrors((prev) => {
            prev.errors[imageIndex] = true
            return { errors: prev.errors }
          })
        }
        {...(isError && { src: '/images/fallback.svg' })}
      />
      {isDoublePage && (
        <MangaImage
          aria-hidden={isError2}
          imageIndex={nextImageIndex}
          manga={manga}
          onError={() =>
            setImageErrors((prev) => {
              prev.errors[nextImageIndex] = true
              return { errors: prev.errors }
            })
          }
          {...(isError2 && { src: '/images/fallback.svg' })}
        />
      )}
    </li>
  )
}
