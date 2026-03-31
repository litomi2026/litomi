'use client'

import { Image, LayoutGrid } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useRef } from 'react'
import { twMerge } from 'tailwind-merge'

import { getViewFromSearchParams, setViewToSearchParams, View } from '@/utils/param'

const VIEW_OPTIONS = [
  { value: View.CARD, label: '카드', Icon: LayoutGrid },
  { value: View.IMAGE, label: '그림', Icon: Image },
] as const

type Props = {
  className?: string
}

export default function ViewToggle({ className = '' }: Readonly<Props>) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const searchParams = useSearchParams()
  const view = getViewFromSearchParams(searchParams)
  const activeIndex = Math.max(
    0,
    VIEW_OPTIONS.findIndex(({ value }) => value === view),
  )

  function focusOption(index: number) {
    requestAnimationFrame(() => {
      buttonRefs.current[index]?.focus()
    })
  }

  function handleMove(nextIndex: number) {
    const nextView = VIEW_OPTIONS[nextIndex]?.value

    if (!nextView || nextView === view) {
      focusOption(nextIndex)
      return
    }

    setView(nextView)
    focusOption(nextIndex)
  }

  function setView(nextView: View) {
    if (nextView === view) {
      return
    }

    const url = new URL(window.location.href)
    setViewToSearchParams(url.searchParams, nextView)
    window.history.replaceState({}, '', url)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      handleMove((index + 1) % VIEW_OPTIONS.length)
      return
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      handleMove((index - 1 + VIEW_OPTIONS.length) % VIEW_OPTIONS.length)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      handleMove(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      handleMove(VIEW_OPTIONS.length - 1)
    }
  }

  return (
    <div
      aria-label="작품 보기 방식"
      className={twMerge(
        'relative inline-grid grid-cols-2 overflow-hidden rounded-xl border border-white/8 bg-zinc-950/80 p-[2px] text-sm text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm',
        className,
      )}
      role="radiogroup"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-[2px] left-[2px] w-[calc(50%-2px)] rounded-[0.65rem] border border-white/10 bg-zinc-100 shadow-[0_5px_14px_rgba(0,0,0,0.22)] transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {VIEW_OPTIONS.map(({ value, label, Icon }, index) => (
        <button
          aria-checked={view === value}
          aria-label={label}
          className="relative z-10 inline-flex min-h-8 min-w-[3.1rem] touch-manipulation select-none items-center justify-center gap-0.5 rounded-[0.65rem] px-2 py-1 text-[11px] font-medium tracking-[-0.01em] text-zinc-400 transition-[color,transform] duration-200 hover:text-zinc-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-checked:font-semibold aria-checked:text-zinc-950 sm:min-w-[3.4rem] sm:px-2.5 sm:text-xs"
          key={value}
          onClick={() => setView(value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          ref={(node) => {
            buttonRefs.current[index] = node
          }}
          role="radio"
          tabIndex={view === value ? 0 : -1}
          title={label}
          type="button"
        >
          <Icon aria-hidden className="hidden size-3.25 shrink-0 sm:block" strokeWidth={2.25} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
