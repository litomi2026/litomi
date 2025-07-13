'use client'

import dynamic from 'next/dynamic'

import useMounted from '@/hook/useMounted'

// NOTE: 페이지 렌더링 과정과 관계가 없기 때문에 dynamic import 사용하고 ssr: false 옵션 사용
const AmplitudeComponent = dynamic(() => import('./Amplitude'), { ssr: false })

type Props = {
  apiKey: string
}

export default function AmplitudeLazy({ apiKey }: Readonly<Props>) {
  const mounted = useMounted()

  if (!mounted) {
    return null
  }

  return <AmplitudeComponent apiKey={apiKey} />
}
