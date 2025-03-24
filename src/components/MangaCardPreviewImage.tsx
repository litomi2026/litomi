'use client'

import { Manga } from '@/types/manga'
import Link from 'next/link'
import { memo, useEffect, useRef, useState } from 'react'

import { IconNextPage, IconPrevPage } from './icons/IconArrows'
import MangaImage from './MangaImage'

const MAX_DISPLAYED_IMAGES = 4

type Props = {
  manga: Manga
  mangaIndex?: number
}

export default memo(MangaCardPreviewImage)

function MangaCardPreviewImage({ manga, mangaIndex = 0 }: Props) {
  const { id, images } = manga
  const sliderRef = useRef<HTMLAnchorElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const totalSlides = Math.min(images.length, MAX_DISPLAYED_IMAGES)

  useEffect(() => {
    const slider = sliderRef.current
    if (!slider) return
    const slides = Array.from(slider.children)
    const observerOptions = { threshold: 0.6 } // 60% 노출 시 활성화
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const newIndex = slides.indexOf(entry.target)
          if (newIndex !== activeIndex) setActiveIndex(newIndex)
        }
      })
    }, observerOptions)
    slides.forEach((slide) => observer.observe(slide))
    return () => observer.disconnect()
  }, [activeIndex])

  // 좌우 버튼 대상 계산
  const prevIndex = (activeIndex - 1 + totalSlides) % totalSlides
  const nextIndex = (activeIndex + 1) % totalSlides

  // 슬라이더 컨테이너의 scrollLeft만 조정하여 수평 스크롤 제어
  const scrollToSlide = (index: number) => {
    if (!sliderRef.current) return
    const slider = sliderRef.current
    const slide = slider.children[index] as HTMLElement
    slider.scrollTo({ left: slide.offsetLeft })
  }

  return (
    <>
      {/* 슬라이드 컨테이너 */}
      <Link
        className="flex overflow-x-auto h-fit snap-x snap-mandatory select-none scrollbar-hidden [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-contain [&_img]:aspect-[4/3] [&_img]:sm:aspect-[3/4] [&_img]:md:aspect-[4/3] [&_img]:lg:aspect-[3/4]"
        href={`/manga/${id}`}
        ref={sliderRef}
      >
        {Array.from({ length: totalSlides }).map((_, i) => (
          <MangaImage
            fetchPriority={mangaIndex < 4 && i < 1 ? 'high' : undefined}
            imageIndex={i}
            key={i}
            loading={i >= 1 ? 'lazy' : undefined}
            manga={manga}
          />
        ))}
      </Link>

      {/* 좌우 이동 버튼 (JavaScript로 동적으로 업데이트) */}
      <div className="[&_button]:[@media(pointer:coarse)]:hidden [&_button]:absolute [&_button]:top-1/2 [&_button]:-translate-y-1/2 [&_button]:z-10 [&_button]:rounded-full [&_button]:bg-zinc-700/50 [&_button]:text-white [&_button]:p-2 [&_button]:ring-zinc-400 [&_button]:active:ring-2">
        <button aria-label="이전 이미지" className="left-1" onClick={() => scrollToSlide(prevIndex)}>
          <IconPrevPage className="w-4" />
        </button>
        <button aria-label="다음 이미지" className="right-1" onClick={() => scrollToSlide(nextIndex)}>
          <IconNextPage className="w-4" />
        </button>
      </div>

      {/* 슬라이드 인디케이터 */}
      <div className="absolute z-10 bottom-1 left-1/2 -translate-x-1/2 flex gap-2 [&_div]:w-3 [&_div]:h-3 [&_div]:rounded-full [&_div]:bg-zinc-300 [&_div]:border [&_div]:border-zinc-500 [&_div]:aria-selected:bg-brand-gradient">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div aria-selected={i === activeIndex} key={i} />
        ))}
      </div>
    </>
  )
}
