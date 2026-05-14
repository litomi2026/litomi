'use client'

import { Loader2 } from 'lucide-react'
import { useLinkStatus } from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { LINK_PENDING_DELAY } from '@/constants/policy'

type Props = {
  children?: ReactNode
  className?: string
  wrapperClassName?: string
}

export default function LinkPending({ children, className, wrapperClassName }: Props) {
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
      <div className={wrapperClassName ?? twMerge(className, 'flex items-center justify-center')}>
        <Loader2 className={twMerge('animate-spin', className)} />
      </div>
    )
  }

  return <>{children}</>
}
