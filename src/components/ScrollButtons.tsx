'use client'

import IconArrowLeft from './icons/IconArrowLeft'

const PADDING = 20

export default function ScrollButtons() {
  const scrollToTop = () => {
    if (window.scrollY > PADDING) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToBottom = () => {
    if (window.scrollY < document.body.scrollHeight - PADDING) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }
  }

  return (
    <div
      className="fixed bottom-5 right-5 pb-safe flex flex-col gap-2 z-50 xl:hidden text-white 
        [&_button]:[background-image:linear-gradient(var(--color-background),var(--color-background)),linear-gradient(to_right,var(--color-brand-start),var(--color-brand-end))] 
        [&_button]:bg-origin-border [&_button]:bg-clip-content-border [&_button]:border-2 [&_button]:border-transparent
        [&_button]:transition [&_button]:hover:brightness-150 [&_button]:active:brightness-50 [&_button]:rounded-full"
    >
      <button onClick={scrollToTop}>
        <IconArrowLeft className="p-2 w-9 sm:w-10 rotate-90" />
      </button>
      <button onClick={scrollToBottom}>
        <IconArrowLeft className="p-2 w-9 sm:w-10 rotate-270" />
      </button>
    </div>
  )
}
