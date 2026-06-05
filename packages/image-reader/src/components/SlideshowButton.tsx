'use client'

import type { ReaderLayout, ReaderPage } from '#reader/model/readerLayout'

import { useReaderMessages, useReaderNoticeHandler } from '#reader/context'
import { useReaderStore } from '#reader/state/readerStore'
import { Dialog, DialogBody, DialogFooter, DialogHeader, Toggle } from '@litomi/ui'
import { Clock3, Play, Repeat2 } from 'lucide-react'
import ms from 'ms'
import { useEffect, useId, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

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
  const repeatInputId = useId()
  const messages = useReaderMessages()
  const onNotice = useReaderNoticeHandler()

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
            navigationType: 'relative',
          })
          return
        }

        if (isRepeatingRef.current) {
          navigateToPageIndex(0, {
            maxIndex: maxPageIndex,
            navigationType: 'relative',
          })
          return
        }

        onNotice?.({
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
  }, [isRunning, maxPageIndex, messages, navigateToPageIndex, onNotice, pageIndex, readerLayout])

  return (
    <>
      <button
        aria-expanded={isRunning ? undefined : isOpened}
        aria-haspopup={isRunning ? undefined : 'dialog'}
        className={twMerge(
          className,
          'inline-flex items-center justify-center gap-1.5 tabular-nums',
          isRunning &&
            'border-brand/50 bg-brand/10 text-foreground hover:border-brand/70 hover:bg-brand/15 active:bg-brand/20',
        )}
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
        {isRunning ? (
          <>
            <span aria-hidden className="size-1.5 rounded-full bg-brand shadow-[0_0_0_3px_rgba(245,188,255,0.14)]" />
            <span>{messages.slideshowStopButton}</span>
          </>
        ) : (
          <span>{messages.slideshowStartButton}</span>
        )}
      </button>
      <Dialog
        ariaLabel={messages.slideshowTitle}
        className="h-auto max-w-[calc(100dvw-2rem)] rounded-xl border border-zinc-700/80 bg-zinc-900/95 shadow-2xl shadow-black/60 sm:max-w-sm sm:border"
        onClose={() => setIsOpened(false)}
        open={isOpened}
      >
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
          <DialogHeader
            closeButtonClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70"
            closeButtonLabel={messages.closeDialog}
            onClose={() => setIsOpened(false)}
            title={messages.slideshowTitle}
            titleClassName="text-base font-semibold"
          />
          <DialogBody className="p-3">
            <div className="text-sm">
              <label
                className="flex items-center justify-between gap-4 rounded-lg p-3 transition focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-brand/15"
                htmlFor={intervalInputId}
              >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground/5 text-zinc-400">
                    <Clock3 aria-hidden className="size-4" />
                  </span>
                  <span className="font-medium leading-snug text-foreground">{messages.intervalLabel}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1">
                  <input
                    autoFocus
                    className="w-11 bg-transparent text-right text-base font-semibold tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    defaultValue={10}
                    id={intervalInputId}
                    inputMode="numeric"
                    max={999}
                    min={1}
                    name="interval"
                    onFocus={(e) => e.currentTarget.select()}
                    onKeyDown={(e) => e.stopPropagation()}
                    pattern="[0-9]*"
                    required
                    type="number"
                  />
                  <span className="text-xs font-medium text-zinc-500">{messages.secondsUnit}</span>
                </span>
              </label>
              <div className="flex items-center justify-between gap-4 rounded-lg p-3">
                <label className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer" htmlFor={repeatInputId}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground/5 text-zinc-400">
                    <Repeat2 aria-hidden className="size-4" />
                  </span>
                  <strong className="font-medium leading-snug text-foreground">{messages.repeatLabel}</strong>
                </label>
                <Toggle
                  aria-label={messages.slideshowRepeatLabel}
                  className="w-12 border-zinc-600 bg-zinc-700 peer-checked:bg-brand/80 peer-focus-visible:ring-zinc-500/70 peer-focus-visible:ring-offset-zinc-900"
                  defaultChecked={false}
                  id={repeatInputId}
                  name="repeat"
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="grid grid-cols-2 gap-2 text-sm font-semibold">
            <button
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-center leading-tight text-background transition hover:bg-foreground/95 active:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              type="submit"
            >
              <Play aria-hidden className="size-4" />
              {messages.slideshowStartAction}
            </button>
            <button
              className="min-w-0 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-2 text-center leading-tight text-foreground transition hover:bg-foreground/10 active:bg-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => setIsOpened(false)}
              type="button"
            >
              {messages.cancelAction}
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
