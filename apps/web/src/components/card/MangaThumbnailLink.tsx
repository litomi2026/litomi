'use client'

import type { ComponentPropsWithRef, MouseEvent } from 'react'

import { Capacitor } from '@capacitor/core'

import { Link } from '@/i18n/navigation'

type Props = ComponentPropsWithRef<typeof Link>

export default function MangaThumbnailLink({ onClick, ref, ...props }: Props) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)

    if (event.defaultPrevented) {
      return
    }

    if (Capacitor.getPlatform() === 'ios') {
      event.preventDefault()
    }
  }

  return <Link {...props} onClick={handleClick} ref={ref} />
}
