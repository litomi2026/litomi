'use client'

import { type ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  children: ReactNode
  className?: string
}

export default function DialogFooter({ children, className }: Props) {
  return (
    <div
      className={twMerge(
        'shrink-0 border-t border-zinc-800 bg-zinc-900 p-4 max-sm:pl-[calc(1rem+var(--safe-area-left))] max-sm:pr-[calc(1rem+var(--safe-area-right))]',
        className,
      )}
    >
      {children}
    </div>
  )
}
