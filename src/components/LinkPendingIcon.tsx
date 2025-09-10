'use client'

import { useLinkStatus } from 'next/link'
import { ReactNode } from 'react'

import IconSpinner from './icons/IconSpinner'

type Props = {
  icon: ReactNode
  className?: string
}

export default function LinkPendingIcon({ icon, className }: Props) {
  const { pending } = useLinkStatus()

  if (pending) {
    return <IconSpinner className={className} />
  }

  return <>{icon}</>
}
