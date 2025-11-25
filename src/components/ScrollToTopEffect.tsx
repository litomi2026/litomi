'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function ScrollToTopEffect() {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return null
}
