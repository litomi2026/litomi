'use client'

import dynamic from 'next/dynamic'

import useMounted from '@/hook/useMounted'

const AmplitudeComponent = dynamic(() => import('./Amplitude'), { ssr: false })

type Props = {
  apiKey: string
}

export default function AmplitudeLazy({ apiKey }: Props) {
  const mounted = useMounted()

  if (!mounted) {
    return null
  }

  return <AmplitudeComponent apiKey={apiKey} />
}
