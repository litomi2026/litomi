'use client'

import { type ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  children: ReactNode
  className?: string
}

export default function DialogBody({ children, className }: Props) {
  return (
    <div
      className={twMerge(
        'flex-1 min-h-0 overflow-y-auto sm:p-4 pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))]',
        className,
      )}
    >
      {children}
    </div>
  )
}
