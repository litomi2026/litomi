'use client'

import ms from 'ms'
import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'
import Toggle from '@/components/ui/Toggle'

import { useImageIndexStore } from './store/imageIndex'

type Props = {
  className?: string
  offset: number
  maxImageIndex: number
  onIntervalChange?: (index: number) => void
}

export default function SlideshowButton({ className = '', maxImageIndex, offset, onIntervalChange }: Readonly<Props>) {
  const getImageIndex = useImageIndexStore((state) => state.getImageIndex)
  const [isRunning, setIsRunning] = useState(false)
  const [isOpened, setIsOpened] = useState(false)
  const intervalSecondsRef = useRef(10)
  const isRepeatingRef = useRef(false)
  const intervalIdRef = useRef<number | null>(null)
  const intervalInputId = useId()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const intervalInput = e.currentTarget.elements.namedItem('interval')
    if (!(intervalInput instanceof HTMLInputElement)) {
      return
    }

    const repeatInput = e.currentTarget.elements.namedItem('repeat')
    const nextIsRepeating = repeatInput instanceof HTMLInputElement ? repeatInput.checked : false
    const nextIntervalSeconds = intervalInput.valueAsNumber
    intervalSecondsRef.current = nextIntervalSeconds
    isRepeatingRef.current = nextIsRepeating
    setIsOpened(false)
    setIsRunning(true)
  }

  useEffect(() => {
    if (!isRunning) {
      return
    }

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }

    intervalIdRef.current = window.setInterval(
      () => {
        const imageIndex = getImageIndex()
        const nextImageIndex = imageIndex + offset

        if (nextImageIndex <= maxImageIndex) {
          onIntervalChange?.(nextImageIndex)
        } else if (isRepeatingRef.current) {
          onIntervalChange?.(0)
        } else {
          toast.info('마지막 이미지예요')
          setIsRunning(false)
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current)
            intervalIdRef.current = null
          }
        }
      },
      ms(`${intervalSecondsRef.current}s`),
    )

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [getImageIndex, isRunning, maxImageIndex, offset, onIntervalChange])

  return (
    <>
      <button
        className={className}
        onClick={() => {
          if (isRunning) {
            setIsRunning(false)
            if (intervalIdRef.current) {
              clearInterval(intervalIdRef.current)
              intervalIdRef.current = null
            }
            return
          }
          setIsOpened(true)
        }}
      >
        {isRunning ? '중지' : '슬라이드쇼'}
      </button>
      <Dialog
        ariaLabel="슬라이드쇼"
        className="rounded-xl border-2 h-auto max-w-sm max-sm:p-0 sm:max-w-sm"
        onClose={() => setIsOpened(false)}
        open={isOpened}
      >
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
          <DialogHeader onClose={() => setIsOpened(false)} title="슬라이드쇼" />
          <DialogBody>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4 whitespace-nowrap [&_h4]:font-semibold">
              <label htmlFor={intervalInputId}>주기</label>
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  className="border-2 text-base w-16 text-foreground rounded-lg px-2 py-0.5 border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  defaultValue={10}
                  id={intervalInputId}
                  max={999}
                  min={1}
                  name="interval"
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => e.stopPropagation()}
                  pattern="[0-9]*"
                  required
                  type="number"
                />
                <span>초</span>
              </div>
              <strong>반복</strong>
              <Toggle
                aria-label="슬라이드쇼 반복"
                className="w-14 peer-checked:bg-brand/80"
                defaultChecked={false}
                name="repeat"
              />
            </div>
          </DialogBody>
          <DialogFooter className="grid gap-2 text-sm [&_button]:hover:bg-zinc-800 [&_button]:active:bg-zinc-900 [&_button]:rounded-full [&_button]:transition">
            <button className="border-2 p-2 font-bold text-foreground transition border-zinc-700" type="submit">
              시작
            </button>
            <button className="p-2 text-zinc-500" onClick={() => setIsOpened(false)} type="button">
              취소
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
