'use client'

import type { ReaderLayout, ReaderPage, ReaderPageRenderer } from '#reader/model/readerLayout'

import PageSlider from '#reader/components/PageSlider'
import SlideshowButton from '#reader/components/SlideshowButton'
import ThumbnailStrip from '#reader/components/ThumbnailStrip'
import ViewControlPanel from '#reader/components/ViewControlPanel'
import { useReaderMessages } from '#reader/context'
import { orientations, useReaderSessionStore, useReaderStore } from '#reader/state/readerStore'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

const CONTROL_BUTTON_CLASS_NAME =
  'rounded-full p-2 py-1 min-w-20 transition disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const CORE_BUTTON_CLASS_NAME = twMerge(
  CONTROL_BUTTON_CLASS_NAME,
  'bg-foreground text-background hover:bg-foreground/95 active:bg-foreground/85',
)

const SECONDARY_BUTTON_CLASS_NAME = twMerge(
  CONTROL_BUTTON_CLASS_NAME,
  'border border-foreground/10 bg-foreground/5 text-foreground backdrop-blur hover:border-foreground/15 hover:bg-foreground/10 active:bg-foreground/15',
)

type Props<TPage extends ReaderPage> = {
  isVisible: boolean
  onRequestClose: () => void
  pages: readonly TPage[]
  readerLayout: ReaderLayout<TPage>
  renderThumbnail: ReaderPageRenderer<TPage>
}

export default function ReaderControls<TPage extends ReaderPage>({
  isVisible,
  onRequestClose,
  pages,
  readerLayout,
  renderThumbnail,
}: Props<TPage>) {
  const [isThumbnailStripOpen, setIsThumbnailStripOpen] = useState(false)
  const [isViewControlOpen, setIsViewControlOpen] = useState(false)
  const lowData = useReaderSessionStore((state) => state.lowData)
  const imageFit = useReaderStore((state) => state.imageFit)
  const orientation = useReaderStore((state) => state.orientation)
  const pageView = useReaderStore((state) => state.pageView)
  const readingDirection = useReaderStore((state) => state.readingDirection)
  const scrollAxis = useReaderStore((state) => state.scrollAxis)
  const viewerMode = useReaderStore((state) => state.viewerMode)
  const cycleLowData = useReaderSessionStore((state) => state.cycleLowData)
  const setImageFit = useReaderStore((state) => state.setImageFit)
  const setOrientation = useReaderStore((state) => state.setOrientation)
  const setPageView = useReaderStore((state) => state.setPageView)
  const setScrollAxis = useReaderStore((state) => state.setScrollAxis)
  const setViewerMode = useReaderStore((state) => state.setViewerMode)
  const toggleReadingDirection = useReaderStore((state) => state.toggleReadingDirection)
  const viewControlRef = useRef<HTMLDivElement>(null)
  const messages = useReaderMessages()

  const isDoublePage = pageView === 'double'
  const isHorizontalScrollMode = viewerMode === 'scroll' && scrollAxis === 'horizontal'
  const isPageMode = viewerMode === 'page'
  const isScrollMode = viewerMode === 'scroll'
  const maxPageIndex = Math.max(0, pages.length - 1)

  // NOTE: Escape는 열린 보조 패널부터 닫고, 마지막에 컨트롤 전체를 닫아요
  useEffect(() => {
    if (!isVisible) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      const { altKey, ctrlKey, defaultPrevented, key, metaKey } = event

      if (
        defaultPrevented ||
        altKey ||
        ctrlKey ||
        metaKey ||
        key !== 'Escape' ||
        document.querySelector('dialog[open]')
      ) {
        return
      }

      if (isViewControlOpen) {
        event.preventDefault()
        setIsViewControlOpen(false)
        return
      }

      if (isThumbnailStripOpen) {
        event.preventDefault()
        setIsThumbnailStripOpen(false)
        return
      }

      event.preventDefault()
      onRequestClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isThumbnailStripOpen, isViewControlOpen, isVisible, onRequestClose])

  // NOTE: 컨트롤 팝업 외부 클릭 시 닫기
  useEffect(() => {
    if (!isViewControlOpen) {
      return
    }

    function handleClickOutside(e: MouseEvent) {
      if (viewControlRef.current && !viewControlRef.current.contains(e.target as Node)) {
        setIsViewControlOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isViewControlOpen, setIsViewControlOpen])

  return (
    <footer
      aria-hidden={!isVisible}
      className={twMerge(
        'fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-t border-zinc-500 px-safe pb-safe transition opacity-0 pointer-events-none',
        'data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto',
      )}
      data-visible={isVisible ? 'true' : 'false'}
      inert={!isVisible}
    >
      <div className="p-3 grid gap-1.5 select-none">
        {isThumbnailStripOpen && (
          <ThumbnailStrip pages={pages} readerLayout={readerLayout} renderThumbnail={renderThumbnail} />
        )}
        <PageSlider maxPageIndex={maxPageIndex} readerLayout={readerLayout} />
        <div
          aria-label={messages.controlsToolbarLabel}
          className="font-semibold whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-background"
          role="toolbar"
        >
          <button
            aria-pressed={isPageMode}
            className={CORE_BUTTON_CLASS_NAME}
            onClick={() => setViewerMode(isPageMode ? 'scroll' : 'page')}
            type="button"
          >
            {messages.viewerModeButtons[viewerMode]}
          </button>
          {isScrollMode && (
            <button
              aria-pressed={isHorizontalScrollMode}
              className={CORE_BUTTON_CLASS_NAME}
              onClick={() => setScrollAxis(isHorizontalScrollMode ? 'vertical' : 'horizontal')}
              type="button"
            >
              {messages.scrollAxisButtons[scrollAxis]}
            </button>
          )}
          {isPageMode && (
            <button
              className={CORE_BUTTON_CLASS_NAME}
              onClick={() => {
                const currentIndex = orientations.indexOf(orientation)
                const nextIndex = (currentIndex + 1) % orientations.length
                setOrientation(orientations[nextIndex])
              }}
              type="button"
            >
              {messages.viewerOrientationButtons[orientation]}
            </button>
          )}
          <button
            aria-pressed={isDoublePage}
            className={CORE_BUTTON_CLASS_NAME}
            onClick={() => setPageView(isDoublePage ? 'single' : 'double')}
            type="button"
          >
            {messages.pageViewButtons[pageView]}
          </button>
          <button
            aria-label={messages.readingDirectionButtons[readingDirection]}
            className={twMerge(CORE_BUTTON_CLASS_NAME, 'flex items-center justify-center gap-1')}
            onClick={toggleReadingDirection}
            type="button"
          >
            {readingDirection === 'ltr' ? messages.readingDirectionLeftShort : messages.readingDirectionRightShort}
            <ArrowRight className="size-4" />
            {readingDirection === 'ltr' ? messages.readingDirectionRightShort : messages.readingDirectionLeftShort}
          </button>
          <button
            className={CORE_BUTTON_CLASS_NAME}
            onClick={() => setImageFit(imageFit === 'contain' ? 'width' : imageFit === 'width' ? 'height' : 'contain')}
            type="button"
          >
            {messages.imageFitButtons[imageFit]}
          </button>
          {isScrollMode && (
            <div className="relative" ref={viewControlRef}>
              <button
                aria-expanded={isViewControlOpen}
                className={twMerge(SECONDARY_BUTTON_CLASS_NAME, 'flex items-center justify-center gap-1')}
                onClick={() => setIsViewControlOpen((prev) => !prev)}
                type="button"
              >
                {messages.viewControlsButton}
              </button>
              {isViewControlOpen && <ViewControlPanel />}
            </div>
          )}
          <button
            aria-expanded={isThumbnailStripOpen}
            className={twMerge(SECONDARY_BUTTON_CLASS_NAME, 'flex items-center justify-center gap-1')}
            onClick={() => setIsThumbnailStripOpen((prev) => !prev)}
            title={messages.previewButton}
            type="button"
          >
            {messages.previewButton}
          </button>
          <SlideshowButton
            className={SECONDARY_BUTTON_CLASS_NAME}
            maxPageIndex={maxPageIndex}
            readerLayout={readerLayout}
          />
          <button className={SECONDARY_BUTTON_CLASS_NAME} onClick={cycleLowData} type="button">
            {messages.lowDataLabels[lowData]}
          </button>
        </div>
      </div>
    </footer>
  )
}
