'use client'

import { ReactNode, useEffect } from 'react'

type BottomSheetItemProps = {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export default function BottomSheet({ isOpen, onClose, children, title }: Props) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="absolute inset-0 z-50">
      <div aria-hidden className="absolute inset-0 bg-black/80 animate-fade-in-fast" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl pb-safe animate-[slide-up_0.25s_ease-out]"
        role="dialog"
      >
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-zinc-600 rounded-full" />
        </div>
        {title && (
          <div className="px-4 pb-2">
            <h2 className="text-sm font-medium text-zinc-400">{title}</h2>
          </div>
        )}
        <div className="px-2 pb-4">{children}</div>
      </div>
    </div>
  )
}

export function BottomSheetItem({ children, onClick, disabled, className = '' }: BottomSheetItemProps) {
  return (
    <button
      aria-disabled={disabled}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left rounded-xl transition
        hover:bg-zinc-800 active:bg-zinc-800/50
        aria-disabled:opacity-50 aria-disabled:pointer-events-none ${className}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
