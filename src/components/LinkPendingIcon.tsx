'use client'

import { useLinkStatus } from 'next/link'
import { ReactNode, useEffect, useState } from 'react'

import { LINK_PENDING_DELAY } from '@/constants/policy'

import IconSpinner from './icons/IconSpinner'

type Props = {
  icon: ReactNode
  className?: string
}

export default function LinkPendingIcon({ icon, className }: Props) {
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
    return <IconSpinner className={className} />
  }

  return <>{icon}</>
}
