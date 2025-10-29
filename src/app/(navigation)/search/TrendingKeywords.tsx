'use client'

import { ChevronRight } from 'lucide-react'
import { ComponentProps, PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { twMerge } from 'tailwind-merge'

import KeywordLink from './KeywordLink'
import useTrendingKeywordsQuery from './useTrendingKeywordsQuery'

const ROTATION_INTERVAL = 5000
const SCROLL_MOMENTUM_DELAY = 1000 // NOTE: 스크롤 모멘텀을 방지하기 위해 1초 대기

export default function TrendingKeywords() {
  const { data } = useTrendingKeywordsQuery()
  const [currentIndex, setCurrentIndex] = useState(0)
  const trendingKeywords = data && data.keywords.length > 0 ? data.keywords : [{ keyword: 'language:korean' }]
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollContainerDesktopRef = useRef<HTMLDivElement>(null)
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isUserInteractingRef = useRef(false)
  const scrollDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isProgrammaticScrollRef = useRef(false)
  const trendingKeywordCount = trendingKeywords.length
  const { ref: lastRef, inView: isLastKeywordInView } = useInView()

  function scrollRight() {
    const container = scrollContainerDesktopRef.current
    if (container) {
      const scrollAmount = container.clientWidth * 0.8
      container.scrollTo({
        left: container.scrollLeft + scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const rotateToNext = useCallback(() => {
    if (isUserInteractingRef.current || trendingKeywordCount === 1) {
      return
    }

    setCurrentIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % trendingKeywordCount
      scrollToKeyword(nextIndex)
      return nextIndex
    })
  }, [trendingKeywordCount])

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

  function handleClick(index: number) {
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
    if (trendingKeywordCount > 1) {
      startRotation()
    }

    return () => {
      stopRotation()
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current)
      }
    }
  }, [trendingKeywordCount, startRotation, stopRotation])

  return (
    <>
      {/* Mobile */}
      <div className="relative grid gap-2 sm:hidden">
        <div className="flex items-center justify-between text-zinc-500 text-xs">
          <span>인기 검색어</span>
          {trendingKeywordCount > 1 && (
            <span className="text-zinc-600">
              {currentIndex + 1} / {trendingKeywordCount}
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
          {trendingKeywords.map(({ keyword }, i) => (
            <KeywordLink
              ariaCurrent={currentIndex === i}
              className="max-w-full snap-center aria-current:bg-zinc-700 aria-current:text-zinc-100"
              index={i}
              key={keyword}
              keyword={keyword}
              onBlur={handleInteractionEnd}
              onClick={() => handleClick(i)}
              onFocus={() => handleFocus(i)}
            />
          ))}
        </div>
        <div className="px-3">
          <div className="flex gap-0.5 justify-center overflow-x-auto max-w-full">
            {trendingKeywords.map(({ keyword }, i) => (
              <button
                aria-current={currentIndex === i}
                aria-label={`Keyword ${i + 1}`}
                className="rounded-full transition-all shrink-0 size-1.5 bg-zinc-600 hover:bg-zinc-500 aria-current:w-6 aria-current:bg-zinc-400"
                key={keyword}
                onClick={() => handleClick(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="relative hidden sm:grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg md:px-3 md:p-2 md:bg-zinc-900/50">
        <div className="flex items-center gap-1 py-1 text-zinc-500 text-xs">
          <span>인기</span>
          <span className="hidden sm:inline">검색어</span>
        </div>
        <ScrollingButton
          className="right-1"
          disabled={isLastKeywordInView}
          onClick={scrollRight}
          title="오른쪽으로 스크롤하기"
        >
          <ChevronRight className="size-4" strokeWidth={2.5} />
        </ScrollingButton>
        <div className="relative flex gap-2 overflow-x-auto scrollbar-hidden" ref={scrollContainerDesktopRef}>
          {trendingKeywords.map(({ keyword }, i) => (
            <KeywordLink
              index={i}
              key={keyword}
              keyword={keyword}
              linkRef={i === trendingKeywordCount - 1 ? lastRef : undefined}
              textClassName="truncate max-w-[50svw] sm:max-w-[25svw]"
            />
          ))}
        </div>
      </div>
    </>
  )
}

function ScrollingButton({ children, ...props }: PropsWithChildren<ComponentProps<'button'>>) {
  return (
    <button
      {...props}
      className={twMerge(
        'absolute top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-zinc-900 shadow-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition disabled:opacity-0 disabled:pointer-events-none disabled:scale-90 active:scale-95',
        props.className,
      )}
    >
      {children}
    </button>
  )
}
