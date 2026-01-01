'use client'

import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  title: ReactNode
  onClose: () => void
  className?: string
  titleClassName?: string
  closeButtonClassName?: string
  closeButtonLabel?: string
}

export default function DialogHeader({
  title,
  onClose,
  className,
  titleClassName,
  closeButtonClassName,
  closeButtonLabel = '닫기',
}: Props) {
  return (
    <div
      className={twMerge('flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0', className)}
    >
      <h2 className={twMerge('text-base font-semibold text-zinc-100', titleClassName)}>{title}</h2>
      <button
        aria-label={closeButtonLabel}
        className={twMerge('p-2 -mr-2 rounded-lg hover:bg-zinc-800 transition', closeButtonClassName)}
        onClick={onClose}
        type="button"
      >
        <X className="size-5" />
      </button>
    </div>
  )
}
