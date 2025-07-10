'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { SEARCH_PARAMS_WHITELIST } from './constants'

export default function ScrollReset() {
  const searchParams = useSearchParams()
  const trackedValues = SEARCH_PARAMS_WHITELIST.map((key) => searchParams.get(key)).join(',')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [trackedValues])

  return null
}
