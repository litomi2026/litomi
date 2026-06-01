'use client'

import type { ComponentPropsWithoutRef, MouseEvent } from 'react'

import { Capacitor } from '@capacitor/core'
import { forwardRef } from 'react'

import { Link } from '@/i18n/navigation'

type Props = ComponentPropsWithoutRef<typeof Link>

const MangaThumbnailLink = forwardRef<HTMLAnchorElement, Props>(function MangaThumbnailLink(
  { onClick, ...props },
  ref,
) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)

    if (event.defaultPrevented || Capacitor.getPlatform() !== 'ios') {
      return
    }

    event.preventDefault()
  }

  return <Link {...props} onClick={handleClick} ref={ref} />
})

export default MangaThumbnailLink
