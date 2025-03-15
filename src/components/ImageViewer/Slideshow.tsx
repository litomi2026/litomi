'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import Modal from '../Modal'
import { useImageIndexStore } from './store/imageIndex'
import { useNavigationModeStore } from './store/navigationMode'
import { useVirtualizerStore } from './store/virtualizer'

type Props = {
  offset: number
  maxImageIndex: number
}

export default function Slideshow({ maxImageIndex, offset }: Props) {
  const { imageIndex, setImageIndex } = useImageIndexStore()
  const [slideshowInterval, setSlideshowInterval] = useState(0)
  const intervalIdRef = useRef<number | null>(null)
  const virtualizer = useVirtualizerStore((state) => state.virtualizer)
  const navMode = useNavigationModeStore((state) => state.navMode)
  const isTouchMode = navMode === 'touch'
  const onIntervalChange = isTouchMode ? setImageIndex : virtualizer?.scrollToIndex
  const [isOpened, setIsOpened] = useState(false)

  useEffect(() => {
    if (!slideshowInterval) return

    intervalIdRef.current = window.setInterval(() => {
      if (imageIndex + offset <= maxImageIndex) {
        onIntervalChange?.(imageIndex + offset)
      } else {
        toast.info('마지막 이미지입니다.')
        setSlideshowInterval(0)
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current)
          intervalIdRef.current = null
        }
      }
    }, slideshowInterval * 1000)

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [imageIndex, maxImageIndex, offset, onIntervalChange, slideshowInterval])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSlideshowInterval((e.target as HTMLFormElement).interval.valueAsNumber)
    setIsOpened(false)
  }

  return (
    <>
      <button className="bg-blue-500 px-4 py-2 rounded" onClick={() => setIsOpened(true)}>
        슬라이드쇼
      </button>
      <Modal onClose={() => setIsOpened(false)} open={isOpened} showCloseButton showDragButton>
        <form className="bg-gray-950 w-xs rounded-xl p-4 pt-8 shadow-xl border border-gray-800" onSubmit={handleSubmit}>
          <div className="grid grid-cols-[auto_1fr] items-center gap-4 whitespace-nowrap">
            <h4 className="font-semibold">주기</h4>
            <div className="flex items-center gap-2">
              <input
                className="border w-16 text-foreground rounded-lg px-2 py-0.5"
                defaultValue={5}
                max={999}
                min={0}
                name="interval"
                onKeyDown={(e) => e.stopPropagation()}
                pattern="\d*"
                required
                type="number"
              />
              <span>초</span>
            </div>
          </div>
          <div className="grid gap-3 pt-6 [&_button]:hover:bg-gray-800 [&_button]:active:bg-gray-900 [&_button]:rounded-full [&_button]:transition">
            <button
              className="bg-midnight-500 border rounded-full p-2 font-bold text-white transition hover:brightness-110"
              type="submit"
            >
              시작
            </button>
            <button className="p-2 text-gray-500 rounded-full" onClick={() => setIsOpened(false)} type="button">
              취소
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
