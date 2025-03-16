'use client'

import { Manga } from '@/types/manga'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { IconNextPage, IconPrevPage } from './icons/IconArrows'
import MangaImage from './MangaImage'

const MAX_DISPLAYED_IMAGES = 4

type Props = {
  manga: Manga
  mangaIndex?: number
}

export default function MangaCardPreviewImage({ manga, mangaIndex = 0 }: Props) {
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
        className="flex overflow-x-auto h-full snap-x snap-mandatory select-none scrollbar-hidden"
        href={`/manga/${id}`}
        ref={sliderRef}
        target="_blank"
      >
        {Array.from({ length: totalSlides }).map((_, i) => (
          <MangaImage
            className="snap-start flex-shrink-0 w-full object-contain aspect-[3/4]"
            fetchPriority={mangaIndex < 4 && i < 2 ? 'high' : 'low'}
            imageIndex={i}
            key={i}
            manga={manga}
          />
        ))}
      </Link>

      {/* 좌우 이동 버튼 (JavaScript로 동적으로 업데이트) */}
      <div className="[&_button]:[@media(pointer:coarse)]:hidden [&_button]:absolute [&_button]:top-1/2 [&_button]:-translate-y-1/2 [&_button]:rounded-full [&_button]:bg-zinc-700/50 [&_button]:text-white [&_button]:p-2 [&_button]:ring-zinc-400 [&_button]:active:ring-2">
        <button className="left-1" onClick={() => scrollToSlide(prevIndex)}>
          <IconPrevPage className="w-4" />
        </button>
        <button className="right-1" onClick={() => scrollToSlide(nextIndex)}>
          <IconNextPage className="w-4" />
        </button>
      </div>

      {/* 슬라이드 인디케이터 */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2 [&_button]:w-3 [&_button]:h-3 [&_button]:rounded-full [&_button]:bg-zinc-300 [&_button]:border [&_button]:border-zinc-500 [&_button]:aria-pressed:bg-brand-gradient">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            aria-label={`Go to slide ${i + 1}`}
            aria-pressed={i === activeIndex}
            key={i}
            onClick={() => scrollToSlide(i)}
          />
        ))}
      </div>
    </>
  )
}
