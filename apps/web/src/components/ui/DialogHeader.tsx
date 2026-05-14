'use client'

import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  title?: ReactNode
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
      className={twMerge(
        'flex items-center justify-between p-4 bg-zinc-900 border-b-2 border-zinc-800 shrink-0 max-sm:pl-[calc(1rem+var(--safe-area-left))] max-sm:pr-[calc(1rem+var(--safe-area-right))]',
        className,
      )}
    >
      <h2 className={twMerge('text-xl font-bold text-zinc-100 line-clamp-1 break-all', titleClassName)}>{title}</h2>
      <button
        aria-label={closeButtonLabel}
        className={twMerge('p-2 -m-1 rounded-lg hover:bg-zinc-800 transition', closeButtonClassName)}
        onClick={onClose}
        type="button"
      >
        <X className="size-5" />
      </button>
    </div>
  )
}
