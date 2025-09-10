'use client'

import { useLinkStatus } from 'next/link'
import { useEffect, useState } from 'react'

import { LINK_PENDING_DELAY } from '@/constants/policy'

import IconSpinner from './icons/IconSpinner'

type Props = {
  className?: string
}

export default function LinkLoading({ className = '' }: Readonly<Props>) {
  const { pending } = useLinkStatus()
  const [showSpinner, setShowSpinner] = useState(false)

  useEffect(() => {
    if (pending) {
      const timer = setTimeout(() => {
        setShowSpinner(true)
      }, LINK_PENDING_DELAY)

      return () => {
        clearTimeout(timer)
        setShowSpinner(false)
      }
    } else {
      setShowSpinner(false)
    }
  }, [pending])

  if (showSpinner) {
    return (
      <div
        className={`flex items-center justify-center h-full absolute inset-0 bg-background/80 animate-fade-in-fast z-10 ${className}`}
      >
        <IconSpinner className="h-5 w-5 animate-spin text-foreground" />
      </div>
    )
  }

  return null
}
