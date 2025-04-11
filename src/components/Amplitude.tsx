'use client'

import * as amplitude from '@amplitude/analytics-browser'
import { useEffect } from 'react'

type Props = {
  key: string
}

export default function Amplitude({ key }: Props) {
  useEffect(() => {
    amplitude.init(key, { autocapture: { elementInteractions: true } })
  }, [key])

  return null
}
