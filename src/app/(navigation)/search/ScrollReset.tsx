'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function ScrollReset() {
  const searchParams = useSearchParams()
  const query = searchParams.get('query')

  useEffect(() => {
    // Scroll to top when query changes
    window.scrollTo(0, 0)
  }, [query])

  return null
}
