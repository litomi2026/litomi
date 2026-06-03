'use client'

import type { MouseEvent, ReactNode } from 'react'

import { Capacitor } from '@capacitor/core'

import { useRouter } from '@/i18n/navigation'

type Props = {
  children: ReactNode
  className?: string
  href: string
}

export default function MangaTitleLink({ children, className, href }: Props) {
  const router = useRouter()

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (Capacitor.getPlatform() === 'ios') {
      event.preventDefault()
      router.push(href)
    }
  }

  return (
    <a className={className} href={href} onClick={handleClick} target="_blank">
      {children}
    </a>
  )
}
