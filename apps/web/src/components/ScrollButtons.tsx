'use client'

import type { MouseEvent } from 'react'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const PADDING = 30

const BUTTON_CLASS_NAME =
  'group/button grid size-11 place-items-center rounded-full text-zinc-300 transition hover:bg-foreground/10 hover:text-foreground active:scale-95 active:bg-foreground/15 disabled:pointer-events-none disabled:text-zinc-600 disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:size-12'

type ScrollState = {
  canScrollDown: boolean
  canScrollUp: boolean
}

export default function ScrollButtons() {
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScrollDown: false,
    canScrollUp: false,
  })

  const t = useTranslations('TopNavigation.scrollButtons')

  useEffect(() => {
    let frameId = 0

    function updateScrollState() {
      window.cancelAnimationFrame(frameId)

      frameId = window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const maxScrollTop = getMaxScrollTop()

        setScrollState({
          canScrollDown: scrollTop < maxScrollTop - PADDING,
          canScrollUp: scrollTop > PADDING,
        })
      })
    }

    const resizeObserver = new ResizeObserver(() => updateScrollState())

    updateScrollState()
    window.addEventListener('resize', updateScrollState)
    window.addEventListener('scroll', updateScrollState, { passive: true })
    resizeObserver.observe(document.body)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', updateScrollState)
      window.removeEventListener('scroll', updateScrollState)
      resizeObserver.disconnect()
    }
  }, [])

  function scrollToTop(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (window.scrollY > PADDING) {
      window.scrollTo({ top: 0 })
    }
  }

  function scrollToBottom(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    const maxScrollTop = getMaxScrollTop()

    if (window.scrollY < maxScrollTop - PADDING) {
      window.scrollTo({ top: maxScrollTop })
    }
  }

  return (
    <div className="fixed right-[calc(1rem+var(--safe-area-right))] bottom-[calc(5rem+var(--safe-area-bottom))] z-50 text-foreground sm:right-[calc(1.5rem+var(--safe-area-right))] sm:bottom-[calc(1.5rem+var(--safe-area-bottom))] 2xl:hidden">
      <div className="flex flex-col rounded-full border border-zinc-700 bg-zinc-900/95 p-1 backdrop-blur-xs">
        <button
          className={BUTTON_CLASS_NAME}
          disabled={!scrollState.canScrollUp}
          onClick={scrollToTop}
          title={t('top')}
          type="button"
        >
          <ChevronUp className="size-5 transition group-hover/button:-translate-y-0.5" />
        </button>
        <div aria-hidden className="mx-2 h-px bg-zinc-800" />
        <button
          className={BUTTON_CLASS_NAME}
          disabled={!scrollState.canScrollDown}
          onClick={scrollToBottom}
          title={t('bottom')}
          type="button"
        >
          <ChevronDown className="size-5 transition group-hover/button:translate-y-0.5" />
        </button>
      </div>
    </div>
  )
}

function getMaxScrollTop() {
  const scrollElement = document.scrollingElement ?? document.documentElement
  return Math.max(0, scrollElement.scrollHeight - window.innerHeight)
}
