'use client'

import { Manga } from '@litomi/domain/manga/model'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { MAX_THUMBNAIL_IMAGES } from '@/ui-policy'

import LinkPending from '../LinkPending'
import MangaImage from '../MangaImage'
import MangaThumbnailLink from './MangaThumbnailLink'

type Props = {
  className?: string
  manga: Manga
  mangaIndex?: number
  href: string
}

export default function MangaCardPreviewImages({ className, manga, mangaIndex = 0, href }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const sliderRef = useRef<HTMLAnchorElement>(null)
  const t = useTranslations('Common.mangaCard.preview')

  const { images = [] } = manga
  const totalSlides = Math.min(images.length, MAX_THUMBNAIL_IMAGES)
  const prevIndex = (activeIndex - 1 + totalSlides) % totalSlides
  const nextIndex = (activeIndex + 1) % totalSlides

  // 슬라이더 컨테이너의 scrollLeft만 조정하여 수평 스크롤 제어
  function scrollToSlide(index: number) {
    if (!sliderRef.current) return
    const slider = sliderRef.current
    const slide = slider.children[index] as HTMLElement
    slider.scrollTo({ left: slide.offsetLeft })
  }

  // NOTE: 슬라이드 인디케이터 업데이트
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

  return (
    <>
      <MangaThumbnailLink className={className} href={href} prefetch={false} ref={sliderRef}>
        <LinkPending
          className="size-6"
          wrapperClassName="flex items-center justify-center absolute inset-0 bg-background/80 animate-fade-in-fast"
        />
        {Array.from({ length: totalSlides }).map((_, imageIndex) => (
          <MangaImage
            fetchPriority={mangaIndex < 4 && imageIndex < 1 ? 'high' : undefined}
            imageIndex={imageIndex}
            key={imageIndex}
            loading={imageIndex >= 1 ? 'lazy' : undefined}
            mangaId={manga.id}
            src={images[imageIndex]?.thumbnail?.url ?? images[imageIndex]?.original?.url}
            variant="thumbnail"
          />
        ))}
      </MangaThumbnailLink>
      <button
        aria-label={t('previous')}
        className="pointer-coarse:hidden absolute left-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-zinc-700/50 text-foreground p-2 ring-zinc-400 active:ring-2 transition"
        onClick={() => scrollToSlide(prevIndex)}
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        aria-label={t('next')}
        className="pointer-coarse:hidden absolute right-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-zinc-700/50 text-foreground p-2 ring-zinc-400 active:ring-2 transition"
        onClick={() => scrollToSlide(nextIndex)}
      >
        <ChevronRight className="size-4" />
      </button>
      <div className="absolute z-10 bottom-1 left-1/2 -translate-x-1/2 flex gap-2 [&_div]:w-3 [&_div]:h-3 [&_div]:rounded-full [&_div]:bg-zinc-300 [&_div]:border [&_div]:border-zinc-500 [&_div]:aria-current:bg-brand-gradient">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div aria-current={i === activeIndex} key={i} />
        ))}
      </div>
    </>
  )
}
