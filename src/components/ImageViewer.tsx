/* eslint-disable @next/next/no-img-element */
'use client'

import { BASE_URL } from '@/constants/url'
import useImageNavigation from '@/hook/useImageNavigation'
import { usePageViewStore } from '@/store/controller/pageView'
import { type Manga } from '@/types/manga'
import { FormEvent, useEffect, useRef, useState } from 'react'

import useNavigationTouchArea from '../hook/useNavigationTouchArea'
import IconArrow from './icons/IconArrow'

type Props = {
  manga: Manga
}

export default function ImageViewer({ manga }: Props) {
  const { id, images } = manga
  const maxImageIndex = images.length - 1

  const [showController, setShowController] = useState(false)
  const [navMode, setNavMode] = useState<'scroll' | 'touch'>('touch')
  const { pageView, setPageView } = usePageViewStore()

  const isSinglePage = pageView === 'single'
  const isDoublePage = pageView === 'double'
  const isTouchMode = navMode === 'touch'

  const { currentIndex, setCurrentIndex, prevPage, nextPage } = useImageNavigation({
    maxIndex: maxImageIndex,
    offset: isDoublePage ? 2 : 1,
  })

  const { touchOrientation, setTouchOrientation, NavigationTouchArea } = useNavigationTouchArea({
    onNext: nextPage,
    onPrev: prevPage,
  })

  useEffect(() => {
    if (isTouchMode) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'auto'
      }
    }
  }, [isTouchMode])

  const startPage = Math.max(1, currentIndex + 1)
  const endPage = isDoublePage ? Math.min(currentIndex + 2, maxImageIndex + 1) : startPage

  function goToPage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const inputValue = (e.target as HTMLFormElement).page.value
    setCurrentIndex(Number(inputValue) - 1)
  }

  return (
    <ul className="[&_li]:flex [&_li]:justify-center [&_li]:gap-1 [&_img]:h-dvh [&_img]:min-w-0 [&_img]:select-none [&_img]:object-contain [&_img]:aria-hidden:sr-only">
      {showController && (
        <div className="fixed w-max top-1 left-1/2 z-10 -translate-x-1/2">
          <div className="grid gap-1 grid-cols-2 p-1 border backdrop-blur rounded [&_button]:px-2 [&_button]:py-1 [&_button]:opacity-50 [&_button]:rounded [&_button]:border [&_button]:hover:bg-gray-200 [&_button]:active:bg-gray-400 [&_button]:bg-gray-300 [&_button]:text-gray-800 [&_button]:border-gray-500 [&_button]:aria-pressed:opacity-100 [&_button]:aria-pressed:bg-gray-800 [&_button]:aria-pressed:text-white">
            <div className="bg-black col-span-2 rounded px-2 mx-auto">
              {startPage === endPage ? startPage : `${startPage}-${endPage}`} / {maxImageIndex + 1}
            </div>
            <form className="col-span-2 flex gap-1 " onSubmit={goToPage}>
              <input
                className="w-full px-2 border bg-gray-500 border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
                max={maxImageIndex + 1}
                min="1"
                name="page"
                pattern="[0-9]+"
                placeholder={`${currentIndex + 1}`}
                required
                type="number"
              />
              <button
                className="whitespace-nowrap bg-gray-800 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                type="submit"
              >
                <IconArrow className="w-6" />
              </button>
            </form>
            <button aria-pressed={isSinglePage} onClick={() => setPageView('single')}>
              한 쪽 보기
            </button>
            <button aria-pressed={isDoublePage} onClick={() => setPageView('double')}>
              두 쪽 보기
            </button>
            <button aria-pressed={isTouchMode} onClick={() => setNavMode('touch')}>
              터치 모드
            </button>
            <button
              aria-pressed={navMode === 'scroll'}
              className="pointer-events-none"
              onClick={() => setNavMode('scroll')}
            >
              스크롤 모드
            </button>
            {isTouchMode && (
              <>
                <button
                  aria-pressed={touchOrientation === 'horizontal'}
                  onClick={() => setTouchOrientation('horizontal')}
                >
                  좌우 넘기기
                </button>
                <button aria-pressed={touchOrientation === 'vertical'} onClick={() => setTouchOrientation('vertical')}>
                  상하 넘기기
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {Array.from({ length: 10 }).map((_, offset) => {
        const imageIndex = currentIndex + offset

        return (
          <li key={offset} onClick={() => setShowController((prev) => !prev)}>
            {0 <= imageIndex && imageIndex <= maxImageIndex && (
              <img
                alt={`manga-image-${imageIndex + 1}`}
                aria-hidden={offset !== 0}
                fetchPriority={offset === 0 ? 'high' : 'auto'}
                referrerPolicy="same-origin"
                src={`${BASE_URL}/${id}/${images[imageIndex].name}`}
              />
            )}
            {isDoublePage && offset === 0 && 0 <= imageIndex + 1 && imageIndex + 1 <= maxImageIndex && (
              <img
                alt={`manga-image-${imageIndex + 2}`}
                fetchPriority={offset === 0 ? 'high' : undefined}
                referrerPolicy="same-origin"
                src={`${BASE_URL}/${id}/${images[imageIndex + 1].name}`}
              />
            )}
          </li>
        )
      })}
      {isTouchMode && <NavigationTouchArea />}
    </ul>
  )
}
