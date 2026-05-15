'use client'

import type { ReaderLayout, ReaderPage } from '#reader/model/readerLayout'

import { useReaderMessages, useReaderNotice } from '#reader/readerRuntime'
import { useReaderStore } from '#reader/state/readerStore'
import { Dialog, DialogBody, DialogFooter, DialogHeader, Toggle } from '@litomi/ui'
import ms from 'ms'
import { useEffect, useId, useRef, useState } from 'react'

type Props<TPage extends ReaderPage> = {
  className?: string
  maxPageIndex: number
  readerLayout: ReaderLayout<TPage>
}

export default function SlideshowButton<TPage extends ReaderPage>({
  className = '',
  maxPageIndex,
  readerLayout,
}: Props<TPage>) {
  const pageIndex = useReaderStore((state) => state.pageIndex)
  const navigateToPageIndex = useReaderStore((state) => state.navigateToPageIndex)
  const [isRunning, setIsRunning] = useState(false)
  const [isOpened, setIsOpened] = useState(false)

  const intervalSecondsRef = useRef(10)
  const isRepeatingRef = useRef(false)
  const timeoutIdRef = useRef<number | null>(null)
  const intervalInputId = useId()
  const messages = useReaderMessages()
  const notify = useReaderNotice()

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
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

  // NOTE: 페이지 전환 시 타이머를 초기화하기 위해 pageIndex를 구독하고 변경될 때마다 타이머를 다시 예약해요.
  useEffect(() => {
    if (!isRunning) {
      return
    }

    if (timeoutIdRef.current) {
      window.clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }

    timeoutIdRef.current = window.setTimeout(
      () => {
        timeoutIdRef.current = null
        const currentSpreadIndex = readerLayout.spreadIndexByPageIndex[pageIndex] ?? 0
        const nextPageIndex = readerLayout.spreads[currentSpreadIndex + 1]?.startPageIndex ?? null

        if (typeof nextPageIndex === 'number') {
          navigateToPageIndex(nextPageIndex, {
            maxIndex: maxPageIndex,
            scrollRowIndex: readerLayout.spreadIndexByPageIndex[nextPageIndex] ?? nextPageIndex,
          })
          return
        }

        if (isRepeatingRef.current) {
          navigateToPageIndex(0, { maxIndex: maxPageIndex, scrollRowIndex: 0 })
          return
        }

        notify({
          code: 'slideshow-ended',
          id: 'reader:slideshow-ended',
          message: messages.lastPageNotice,
          severity: 'info',
        })

        setIsRunning(false)
      },
      ms(`${intervalSecondsRef.current}s`),
    )

    return () => {
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
    }
  }, [isRunning, maxPageIndex, messages, navigateToPageIndex, notify, pageIndex, readerLayout])

  return (
    <>
      <button
        aria-expanded={isRunning ? undefined : isOpened}
        aria-haspopup={isRunning ? undefined : 'dialog'}
        className={className}
        onClick={() => {
          if (isRunning) {
            setIsRunning(false)
            if (timeoutIdRef.current) {
              window.clearTimeout(timeoutIdRef.current)
              timeoutIdRef.current = null
            }
            return
          }
          setIsOpened(true)
        }}
        type="button"
      >
        {isRunning ? messages.slideshowStopButton : messages.slideshowStartButton}
      </button>
      <Dialog
        ariaLabel={messages.slideshowTitle}
        className="rounded-xl border-2 h-auto max-w-sm max-sm:p-0 sm:max-w-sm"
        onClose={() => setIsOpened(false)}
        open={isOpened}
      >
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
          <DialogHeader
            closeButtonLabel={messages.closeDialog}
            onClose={() => setIsOpened(false)}
            title={messages.slideshowTitle}
          />
          <DialogBody>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4 whitespace-nowrap [&_h4]:font-semibold">
              <label htmlFor={intervalInputId}>{messages.intervalLabel}</label>
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
                <span>{messages.secondsUnit}</span>
              </div>
              <strong>{messages.repeatLabel}</strong>
              <Toggle
                aria-label={messages.slideshowRepeatLabel}
                className="w-14 peer-checked:bg-brand/80"
                defaultChecked={false}
                name="repeat"
              />
            </div>
          </DialogBody>
          <DialogFooter className="grid gap-2 text-sm [&_button]:hover:bg-zinc-800 [&_button]:active:bg-zinc-900 [&_button]:rounded-full [&_button]:transition">
            <button className="border-2 p-2 font-bold text-foreground transition border-zinc-700" type="submit">
              {messages.slideshowStartAction}
            </button>
            <button className="p-2 text-zinc-500" onClick={() => setIsOpened(false)} type="button">
              {messages.cancelAction}
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
