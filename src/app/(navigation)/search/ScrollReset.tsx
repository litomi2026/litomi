'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { SEARCH_PAGE_SEARCH_PARAMS } from './constants'

export default function ScrollReset() {
  const searchParams = useSearchParams()
  const trackedValues = SEARCH_PAGE_SEARCH_PARAMS.map((key) => searchParams.get(key)).join(',')

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [trackedValues])

  return null
}
