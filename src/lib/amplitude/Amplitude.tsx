'use client'

import { useEffect } from 'react'

import amplitude from '@/lib/amplitude/lazy'

type Props = {
  apiKey: string
}

export default function Amplitude({ apiKey }: Props) {
  useEffect(() => {
    if (apiKey) {
      amplitude.init(apiKey, { minIdLength: 1, autocapture: { elementInteractions: true } })
    }
  }, [apiKey])

  return null
}
