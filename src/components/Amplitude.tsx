'use client'

import * as amplitude from '@amplitude/analytics-browser'
import { useEffect } from 'react'

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
