'use client'

import { ArrowLeft } from 'lucide-react'

const PADDING = 30

export default function ScrollButtons() {
  function scrollToTop(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (window.scrollY > PADDING) {
      window.scrollTo({ top: 0 })
    }
  }

  function scrollToBottom(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (window.innerHeight + window.scrollY < document.body.scrollHeight - PADDING) {
      window.scrollTo({ top: document.body.scrollHeight })
    }
  }

  return (
    <div className="fixed bottom-20 sm:bottom-10 right-5 pb-safe px-safe flex flex-col gap-2 z-50 xl:hidden text-foreground">
      <button
        aria-label="맨 위로 가기"
        className="border-2 border-brand-gradient rounded-full transition hover:brightness-125 active:brightness-75"
        onClick={scrollToTop}
      >
        <ArrowLeft className="p-2 size-9 sm:size-10 rotate-90" />
      </button>
      <button
        aria-label="맨 아래로 가기"
        className="border-2 border-brand-gradient rounded-full transition hover:brightness-125 active:brightness-75"
        onClick={scrollToBottom}
      >
        <ArrowLeft className="p-2 size-9 sm:size-10 rotate-270" />
      </button>
    </div>
  )
}
