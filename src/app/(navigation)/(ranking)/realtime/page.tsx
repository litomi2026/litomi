import { Metadata } from 'next'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'

import RealtimeRanking from './RealtimeRanking'
import RealtimeToggleButton from './RealtimeToggleButton'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: `실시간 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `실시간 - ${SHORT_NAME}`,
    url: '/realtime',
  },
  alternates: {
    canonical: '/realtime',
    languages: { ko: '/realtime' },
  },
}

export default function RealtimePage() {
  return (
    <div className="grid gap-6 mx-auto max-w-screen-sm w-full p-4">
      <h1 className="text-3xl font-bold sr-only">실시간 방문자 현황</h1>
      <RealtimeToggleButton />
      <RealtimeRanking />
    </div>
  )
}
