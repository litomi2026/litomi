'use client'

import { useEffect, useRef } from 'react'

import { SCROLL_THRESHOLD_PX, SCROLL_THROTTLE_MS } from '@/constants/policy'
import useThrottledDownScroll from '@/hook/useThrottledScroll'

type Props = {
  selector: string
}

export default function AutoHideNavigation({ selector }: Props) {
  const isDownScroll = useThrottledDownScroll({ threshold: SCROLL_THRESHOLD_PX, throttle: SCROLL_THROTTLE_MS })
  const componentRef = useRef<HTMLDivElement>(null)
  const navigationHeaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (componentRef.current) {
      navigationHeaderRef.current = componentRef.current.closest(selector)

      navigationHeaderRef.current?.addEventListener('click', () => {
        navigationHeaderRef.current?.removeAttribute('aria-busy')
      })
    }
  }, [selector])

  useEffect(() => {
    if (isDownScroll) {
      navigationHeaderRef.current?.setAttribute('aria-busy', 'true')
    } else {
      navigationHeaderRef.current?.removeAttribute('aria-busy')
    }
  }, [isDownScroll])

  return <div className="hidden" ref={componentRef} />
}
