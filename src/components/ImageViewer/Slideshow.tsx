'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import Modal from '../ui/Modal'
import ToggleButton from '../ui/ToggleButton'
import { useImageIndexStore } from './store/imageIndex'
import { useNavigationModeStore } from './store/navigationMode'
import { useVirtualizerStore } from './store/virtualizer'

type Props = {
  offset: number
  maxImageIndex: number
  onIntervalChange?: (index: number) => void
}

type SlideshowProps = {
  offset: number
  maxImageIndex: number
}

export default memo(SlideshowWrapper)

function Slideshow({ maxImageIndex, offset, onIntervalChange }: Props) {
  const imageIndex = useImageIndexStore((state) => state.imageIndex)
  const [slideshowInterval, setSlideshowInterval] = useState(0)
  const intervalIdRef = useRef<number | null>(null)
  const [isOpened, setIsOpened] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isRepeating, setIsRepeating] = useState(false)

  useEffect(() => {
    if (isOpened) {
      inputRef.current?.focus()
    }
  }, [isOpened])

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
        <form
          className="bg-gray-950 w-screen max-w-xs rounded-xl p-4 pt-8 shadow-xl border border-gray-800"
          onSubmit={handleSubmit}
        >
          <h3 className="font-bold text-xl text-center">슬라이드쇼</h3>
          <div className="grid grid-cols-[auto_1fr] items-center gap-4 mt-4 whitespace-nowrap [&_h4]:font-semibold">
            <h4>주기</h4>
            <div className="flex items-center gap-2">
              <input
                className="border w-16 text-foreground rounded-lg px-2 py-0.5"
                defaultValue={5}
                max={999}
                min={0}
                name="interval"
                onKeyDown={(e) => e.stopPropagation()}
                pattern="\d*"
                ref={inputRef}
                required
                type="number"
              />
              <span>초</span>
            </div>
            <h4>반복</h4>
            <ToggleButton
              className="w-14 aria-pressed:bg-brand-gradient"
              enabled={isRepeating}
              onToggle={setIsRepeating}
            />
          </div>
          <div className="grid gap-3 pt-6 text-sm [&_button]:hover:bg-gray-800 [&_button]:active:bg-gray-900 [&_button]:rounded-full [&_button]:transition">
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

function SlideshowWrapper(props: SlideshowProps) {
  const navMode = useNavigationModeStore((state) => state.navMode)
  const isTouchMode = navMode === 'touch'
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)
  const virtualizer = useVirtualizerStore((state) => state.virtualizer)
  const onIntervalChange = isTouchMode ? setImageIndex : virtualizer?.scrollToIndex

  return <Slideshow {...props} onIntervalChange={onIntervalChange} />
}
