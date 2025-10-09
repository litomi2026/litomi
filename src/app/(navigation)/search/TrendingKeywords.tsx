'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import KeywordLink from './KeywordLink'
import useTrendingKeywordsQuery from './useTrendingKeywordsQuery'

const ROTATION_INTERVAL = 5000
const SCROLL_MOMENTUM_DELAY = 1000 // NOTE: 스크롤 모멘텀을 방지하기 위해 1초 대기

export default function TrendingKeywords() {
  const { data } = useTrendingKeywordsQuery()
  const [currentIndex, setCurrentIndex] = useState(0)
  const trendingKeywords = data && data.keywords.length > 0 ? data.keywords : [{ keyword: 'language:korean' }]
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isUserInteractingRef = useRef(false)
  const scrollDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isProgrammaticScrollRef = useRef(false)

  const rotateToNext = useCallback(() => {
    if (isUserInteractingRef.current || trendingKeywords.length === 1) {
      return
    }

    setCurrentIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % trendingKeywords.length
      scrollToKeyword(nextIndex)
      return nextIndex
    })
  }, [trendingKeywords.length])

  const startRotation = useCallback(() => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current)
    }
    rotationTimerRef.current = setInterval(rotateToNext, ROTATION_INTERVAL)
  }, [rotateToNext])

  const stopRotation = useCallback(() => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current)
      rotationTimerRef.current = null
    }
  }, [])

  function handleScroll() {
    if (!scrollContainerRef.current || isProgrammaticScrollRef.current) {
      return
    }

    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current)
    }

    scrollDebounceTimerRef.current = setTimeout(() => {
      if (!scrollContainerRef.current) {
        return
      }

      const container = scrollContainerRef.current
      const scrollLeft = container.scrollLeft
      const children = Array.from(container.children) as HTMLElement[]

      let closestIndex = 0
      let minDistance = Infinity

      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const childCenter = child.offsetLeft + child.offsetWidth / 2
        const containerCenter = scrollLeft + container.offsetWidth / 2
        const distance = Math.abs(childCenter - containerCenter)

        if (distance < minDistance) {
          minDistance = distance
          closestIndex = i
        }
      }

      setCurrentIndex(closestIndex)
    }, 300)
  }

  function handleInteractionStart() {
    isUserInteractingRef.current = true
    stopRotation()
  }

  function handleInteractionEnd() {
    isUserInteractingRef.current = false
    startRotation()
  }

  function handleTouchStart() {
    handleInteractionStart()
  }

  function handleTouchEnd() {
    setTimeout(() => {
      handleInteractionEnd()
    }, SCROLL_MOMENTUM_DELAY)
  }

  function handleIndicatorClick(index: number) {
    handleInteractionStart()
    setCurrentIndex(index)
    scrollToKeyword(index)
    setTimeout(handleInteractionEnd, ROTATION_INTERVAL)
  }

  function scrollToKeyword(index: number) {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const keywordElement = container.children[index] as HTMLElement

      if (keywordElement) {
        isProgrammaticScrollRef.current = true

        const elementLeft = keywordElement.offsetLeft
        const elementWidth = keywordElement.offsetWidth
        const containerWidth = container.offsetWidth
        const targetScrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2

        container.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth',
        })

        setTimeout(() => {
          isProgrammaticScrollRef.current = false
        }, SCROLL_MOMENTUM_DELAY)
      }
    }
  }

  function handleFocus(index: number) {
    handleInteractionStart()
    scrollToKeyword(index)
  }

  // NOTE: 인기 검색어 회전 시작 및 종료
  useEffect(() => {
    if (trendingKeywords.length > 1) {
      startRotation()
    }

    return () => {
      stopRotation()
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current)
      }
    }
  }, [trendingKeywords.length, startRotation, stopRotation])

  return (
    <>
      {/* Mobile */}
      <div className="relative grid gap-2 sm:hidden">
        <div className="flex items-center justify-between text-zinc-500 text-xs">
          <span>인기 검색어</span>
          {trendingKeywords.length > 1 && (
            <span className="text-zinc-600">
              {currentIndex + 1} / {trendingKeywords.length}
            </span>
          )}
        </div>
        <div
          className="flex gap-1.5 px-1 overflow-x-auto scrollbar-hidden snap-x snap-mandatory scroll-smooth"
          onMouseEnter={handleInteractionStart}
          onMouseLeave={handleInteractionEnd}
          onScroll={handleScroll}
          onTouchEnd={handleTouchEnd}
          onTouchStart={handleTouchStart}
          ref={scrollContainerRef}
        >
          {trendingKeywords.map(({ keyword }, index) => (
            <KeywordLink
              ariaCurrent={currentIndex === index}
              className="max-w-full snap-center aria-current:bg-zinc-700 aria-current:text-zinc-100"
              index={index}
              key={keyword}
              keyword={keyword}
              onBlur={handleInteractionEnd}
              onFocus={() => handleFocus(index)}
            />
          ))}
        </div>
        <div className="px-3">
          <div className="flex gap-0.5 justify-center overflow-x-auto max-w-full">
            {trendingKeywords.map(({ keyword }, i) => (
              <button
                aria-current={currentIndex === i}
                aria-label={`Keyword ${i + 1}`}
                className="rounded-full transition-all flex-shrink-0 size-1.5 bg-zinc-600 hover:bg-zinc-500 aria-current:w-6 aria-current:bg-zinc-400"
                key={keyword}
                onClick={() => handleIndicatorClick(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg md:px-3 md:p-2 md:bg-zinc-900/50">
        <div className="flex items-center gap-1 py-1 text-zinc-500 text-xs">
          <span>인기</span>
          <span className="hidden sm:inline">검색어</span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
          {trendingKeywords.map(({ keyword }, index) => (
            <KeywordLink
              index={index}
              key={keyword}
              keyword={keyword}
              textClassName="truncate max-w-[50svw] sm:max-w-[25svw]"
            />
          ))}
        </div>
      </div>
    </>
  )
}
