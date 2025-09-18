'use client'

import { useEffect } from 'react'

export default function HiyobiPing() {
  useEffect(() => {
    fetch('https://api-kh.hiyobi.org/hiyobi/ping', { headers: { referer: 'https://hiyobi.org/' } })
  }, [])

  return null
}
