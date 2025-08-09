'use client'

import { useLinkStatus } from 'next/link'

import IconSpinner from './icons/IconSpinner'

type Props = {
  className?: string
}

export default function LinkLoading({ className = '' }: Readonly<Props>) {
  const { pending } = useLinkStatus()

  if (!pending) {
    return null
  }

  return (
    <div className={`flex items-center justify-center h-full absolute inset-0 z-10 ${className}`}>
      <IconSpinner className="h-5 w-5 animate-spin text-zinc-500" />
    </div>
  )
}
