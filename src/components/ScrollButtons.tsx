'use client'

import IconArrowLeft from './icons/IconArrowLeft'

const PADDING = 30

export default function ScrollButtons() {
  function scrollToTop(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (window.scrollY > PADDING) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function scrollToBottom(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (window.innerHeight + window.scrollY < document.body.scrollHeight - PADDING) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }
  }

  return (
    <div
      className="fixed bottom-20 sm:bottom-10 right-5 pb-safe px-safe flex flex-col gap-2 z-50 xl:hidden text-foreground 
        [&_button]:border-2 [&_button]:border-brand-gradient [&_button]:transition [&_button]:hover:brightness-125 [&_button]:active:brightness-75 [&_button]:rounded-full"
    >
      <button aria-label="맨 위로 가기" onClick={scrollToTop}>
        <IconArrowLeft className="p-2 w-9 sm:w-10 rotate-90" />
      </button>
      <button aria-label="맨 아래로 가기" onClick={scrollToBottom}>
        <IconArrowLeft className="p-2 w-9 sm:w-10 rotate-270" />
      </button>
    </div>
  )
}
