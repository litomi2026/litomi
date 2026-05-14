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
        'flex-1 min-h-0 overflow-y-auto p-4 pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))] sm:pl-4 sm:pr-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
