'use client'

import { memo, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import Dialog from '@/components/ui/Dialog'
import DialogHeader from '@/components/ui/DialogHeader'
import Toggle from '@/components/ui/Toggle'

import { useImageIndexStore } from './store/imageIndex'

type Props = {
  className?: string
  offset: number
  maxImageIndex: number
  onIntervalChange?: (index: number) => void
}

export default memo(SlideshowButton)

function SlideshowButton({ className = '', maxImageIndex, offset, onIntervalChange }: Readonly<Props>) {
  const getImageIndex = useImageIndexStore((state) => state.getImageIndex)
  const [slideshowInterval, setSlideshowInterval] = useState(0)
  const [isOpened, setIsOpened] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const intervalIdRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!inputRef.current) {
      return
    }

    if (isOpened) {
      inputRef.current?.select()
    } else {
      inputRef.current.value = slideshowInterval.toString()
      setIsChecked(isRepeating)
    }
  }, [isOpened, isRepeating, slideshowInterval])

  useEffect(() => {
    if (!slideshowInterval) {
      return
    }

    intervalIdRef.current = window.setInterval(() => {
      const imageIndex = getImageIndex()
      const nextImageIndex = imageIndex + offset

      if (nextImageIndex <= maxImageIndex) {
        onIntervalChange?.(nextImageIndex)
      } else if (isRepeating) {
        onIntervalChange?.(0)
      } else {
        toast.info('마지막 이미지예요')
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
  }, [getImageIndex, isRepeating, maxImageIndex, offset, onIntervalChange, slideshowInterval])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSlideshowInterval((e.target as HTMLFormElement).interval.valueAsNumber)
    setIsOpened(false)
    setIsRepeating(isChecked)
  }

  const intervalInputId = useId()

  return (
    <>
      <button
        className={className}
        onClick={() => (slideshowInterval > 0 ? setSlideshowInterval(0) : setIsOpened(true))}
      >
        {slideshowInterval > 0 ? '중지' : '슬라이드쇼'}
      </button>
      <Dialog ariaLabel="슬라이드쇼" className="sm:max-w-sm" onClose={() => setIsOpened(false)} open={isOpened}>
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
          <DialogHeader onClose={() => setIsOpened(false)} title="슬라이드쇼" />

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <div className="grid grid-cols-[auto_1fr] items-center gap-4 whitespace-nowrap [&_h4]:font-semibold">
              <label htmlFor={intervalInputId}>주기</label>
              <div className="flex items-center gap-2">
                <input
                  className="border-2 w-16 text-foreground rounded-lg px-2 py-0.5 border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  defaultValue={10}
                  disabled={!isOpened}
                  id={intervalInputId}
                  max={999}
                  min={1}
                  name="interval"
                  onKeyDown={(e) => e.stopPropagation()}
                  pattern="[0-9]*"
                  ref={inputRef}
                  required
                  type="number"
                />
                <span>초</span>
              </div>
              <strong>반복</strong>
              <Toggle
                aria-label="슬라이드쇼 반복"
                className="w-14 peer-checked:bg-brand/80"
                defaultChecked={isChecked}
                onToggle={setIsChecked}
              />
            </div>
          </div>

          <div className="grid gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-zinc-800 bg-zinc-900 text-sm [&_button]:hover:bg-zinc-800 [&_button]:active:bg-zinc-900 [&_button]:rounded-full [&_button]:transition">
            <button className="border-2 p-2 font-bold text-foreground transition border-zinc-700" type="submit">
              시작
            </button>
            <button className="p-2 text-zinc-500" onClick={() => setIsOpened(false)} type="button">
              취소
            </button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
