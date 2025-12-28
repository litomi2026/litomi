'use client'

import { LogLevel } from '@amplitude/analytics-browser/lib/esm/types'
import { useEffect } from 'react'

import amplitude from '@/lib/amplitude/browser'

type Props = {
  apiKey: string
}

export default function Amplitude({ apiKey }: Readonly<Props>) {
  useEffect(() => {
    if (apiKey) {
      amplitude.init(apiKey, {
        minIdLength: 1,
        autocapture: { elementInteractions: true },
        logLevel: process.env.NODE_ENV === 'production' ? LogLevel.None : LogLevel.Warn,
      })
    }
  }, [apiKey])

  return null
}
