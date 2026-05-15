'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { ReaderLayout, ReaderPage, ReaderPageRenderer } from '../model/readerLayout'

import { getLowDataLabel } from '../model/lowData'
import { orientations, useReaderSessionStore, useReaderStore } from '../state/readerStore'
import PageSlider from './PageSlider'
import SlideshowButton from './SlideshowButton'
import ThumbnailStrip from './ThumbnailStrip'
import ViewControlPanel from './ViewControlPanel'

const BOTTOM_BUTTON_CLASS_NAME =
  'rounded-full bg-foreground p-2 py-1 active:bg-zinc-400 disabled:bg-zinc-400 disabled:text-zinc-500 min-w-20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

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
  const orientation = useReaderStore((state) => state.orientation)
  const pageView = useReaderStore((state) => state.pageView)
  const readingDirection = useReaderStore((state) => state.readingDirection)
  const screenFit = useReaderStore((state) => state.screenFit)
  const viewerMode = useReaderStore((state) => state.viewerMode)
  const cycleLowData = useReaderSessionStore((state) => state.cycleLowData)
  const setOrientation = useReaderStore((state) => state.setOrientation)
  const setPageView = useReaderStore((state) => state.setPageView)
  const setScreenFit = useReaderStore((state) => state.setScreenFit)
  const setViewerMode = useReaderStore((state) => state.setViewerMode)
  const toggleReadingDirection = useReaderStore((state) => state.toggleReadingDirection)
  const viewControlRef = useRef<HTMLDivElement>(null)

  const isDoublePage = pageView === 'double'
  const isPageMode = viewerMode === 'page'
  const isWidthFit = screenFit === 'width'
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
      className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-t border-zinc-500 px-safe pb-safe transition opacity-0 pointer-events-none
        data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto"
      data-visible={isVisible ? 'true' : 'false'}
      inert={!isVisible}
    >
      <div className="p-3 grid gap-1.5 select-none">
        {isThumbnailStripOpen && (
          <ThumbnailStrip pages={pages} readerLayout={readerLayout} renderThumbnail={renderThumbnail} />
        )}
        <PageSlider maxPageIndex={maxPageIndex} readerLayout={readerLayout} />
        <div
          aria-label="뷰어 보기 설정"
          className="font-semibold whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-background"
          role="toolbar"
        >
          <button
            aria-pressed={isPageMode}
            className={BOTTOM_BUTTON_CLASS_NAME}
            onClick={() => setViewerMode(isPageMode ? 'scroll' : 'page')}
            type="button"
          >
            {isPageMode ? '페이지' : '스크롤'}보기
          </button>
          <button
            aria-pressed={isDoublePage}
            className={BOTTOM_BUTTON_CLASS_NAME}
            onClick={() => setPageView(isDoublePage ? 'single' : 'double')}
            type="button"
          >
            {isDoublePage ? '두 쪽' : '한 쪽'} 보기
          </button>
          <button
            className={BOTTOM_BUTTON_CLASS_NAME}
            onClick={() => setScreenFit(screenFit === 'all' ? 'width' : isWidthFit ? 'height' : 'all')}
            type="button"
          >
            {screenFit === 'all' ? '화면' : isWidthFit ? '가로' : '세로'} 맞춤
          </button>
          {isDoublePage && (
            <button
              className={`${BOTTOM_BUTTON_CLASS_NAME} flex items-center justify-center gap-1`}
              onClick={toggleReadingDirection}
              type="button"
            >
              좌 {readingDirection === 'ltr' ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />} 우
            </button>
          )}
          {isPageMode && (
            <button
              className={BOTTOM_BUTTON_CLASS_NAME}
              onClick={() => {
                const currentIndex = orientations.indexOf(orientation)
                const nextIndex = (currentIndex + 1) % orientations.length
                setOrientation(orientations[nextIndex])
              }}
              type="button"
            >
              {orientation === 'horizontal' && '좌우 넘기기'}
              {orientation === 'vertical' && '상하 넘기기'}
              {orientation === 'horizontal-reverse' && '우좌 넘기기'}
              {orientation === 'vertical-reverse' && '하상 넘기기'}
            </button>
          )}
          {!isPageMode && (
            <div className="relative" ref={viewControlRef}>
              <button
                aria-expanded={isViewControlOpen}
                className={`${BOTTOM_BUTTON_CLASS_NAME} flex items-center justify-center gap-1`}
                onClick={() => setIsViewControlOpen((prev) => !prev)}
                type="button"
              >
                보기 조절
              </button>
              {isViewControlOpen && <ViewControlPanel />}
            </div>
          )}
          <SlideshowButton
            className={BOTTOM_BUTTON_CLASS_NAME}
            maxPageIndex={maxPageIndex}
            readerLayout={readerLayout}
          />
          <button
            aria-expanded={isThumbnailStripOpen}
            className={`${BOTTOM_BUTTON_CLASS_NAME} flex items-center justify-center gap-1`}
            onClick={() => setIsThumbnailStripOpen((prev) => !prev)}
            title="미리보기"
            type="button"
          >
            미리보기
          </button>
          <button className={BOTTOM_BUTTON_CLASS_NAME} onClick={cycleLowData} type="button">
            {getLowDataLabel(lowData)}
          </button>
        </div>
      </div>
    </footer>
  )
}
