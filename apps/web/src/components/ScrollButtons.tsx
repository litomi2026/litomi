'use client'

import type { MouseEvent } from 'react'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const PADDING = 30

const BUTTON_CLASS_NAME =
  'group/button grid size-11 place-items-center rounded-full text-zinc-300 transition hover:bg-foreground/10 hover:text-foreground active:scale-95 active:bg-foreground/15 disabled:pointer-events-none disabled:text-zinc-600 disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:size-12'

type Props = {
  scrollElement?: HTMLElement | null
}

type ScrollState = {
  canScrollDown: boolean
  canScrollUp: boolean
}

export default function ScrollButtons(props: Props = {}) {
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScrollDown: false,
    canScrollUp: false,
  })

  const t = useTranslations('TopNavigation.scrollButtons')
  const usesElementScroll = 'scrollElement' in props
  const scrollElement = props.scrollElement ?? null

  useEffect(() => {
    if (usesElementScroll && !scrollElement) {
      setScrollState({ canScrollDown: false, canScrollUp: false })
      return
    }

    let frameId = 0
    const scrollTarget = usesElementScroll ? scrollElement : window

    function updateScrollState() {
      window.cancelAnimationFrame(frameId)

      frameId = window.requestAnimationFrame(() => {
        const { maxScrollTop, scrollTop } = getScrollMetrics(scrollElement, usesElementScroll)

        setScrollState({
          canScrollDown: scrollTop < maxScrollTop - PADDING,
          canScrollUp: scrollTop > PADDING,
        })
      })
    }

    const resizeObserver = new ResizeObserver(() => updateScrollState())
    const observedElement = usesElementScroll ? scrollElement : document.body

    updateScrollState()
    window.addEventListener('resize', updateScrollState)
    scrollTarget?.addEventListener('scroll', updateScrollState, { passive: true })

    if (observedElement) {
      resizeObserver.observe(observedElement)
    }

    if (usesElementScroll && scrollElement?.firstElementChild instanceof HTMLElement) {
      resizeObserver.observe(scrollElement.firstElementChild)
    }

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', updateScrollState)
      scrollTarget?.removeEventListener('scroll', updateScrollState)
      resizeObserver.disconnect()
    }
  }, [scrollElement, usesElementScroll])

  function scrollToTop(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    const { scrollTop } = getScrollMetrics(scrollElement, usesElementScroll)

    if (scrollTop > PADDING) {
      scrollToPosition(0, scrollElement, usesElementScroll)
    }
  }

  function scrollToBottom(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    const { maxScrollTop, scrollTop } = getScrollMetrics(scrollElement, usesElementScroll)

    if (scrollTop < maxScrollTop - PADDING) {
      scrollToPosition(maxScrollTop, scrollElement, usesElementScroll)
    }
  }

  if (!scrollState.canScrollDown && !scrollState.canScrollUp) {
    return null
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

function getScrollMetrics(scrollElement: HTMLElement | null, usesElementScroll: boolean) {
  if (usesElementScroll) {
    return {
      maxScrollTop: scrollElement ? Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight) : 0,
      scrollTop: scrollElement?.scrollTop ?? 0,
    }
  }

  const documentScrollElement = document.scrollingElement ?? document.documentElement

  return {
    maxScrollTop: Math.max(0, documentScrollElement.scrollHeight - window.innerHeight),
    scrollTop: window.scrollY,
  }
}

function scrollToPosition(top: number, scrollElement: HTMLElement | null, usesElementScroll: boolean) {
  if (usesElementScroll) {
    scrollElement?.scrollTo({ top })
    return
  }

  window.scrollTo({ top })
}
