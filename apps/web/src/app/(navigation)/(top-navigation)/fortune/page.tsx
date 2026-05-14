import type { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import SexFortune from './SexFortune'

export const metadata: Metadata = {
  title: '오늘의 운세',
  description: '오늘의 분위기와 흐름을 가볍게 확인해 봐요.',
  ...generateOpenGraphMetadata({
    title: '오늘의 운세',
    description: '오늘의 분위기와 흐름을 가볍게 확인해 봐요.',
    url: '/fortune',
  }),
  alternates: {
    canonical: '/fortune',
    languages: { ko: '/fortune' },
  },
}

export default function Page() {
  const todayKey = getSeoulDateKey(new Date())
  return <SexFortune todayKey={todayKey} />
}

function getSeoulDateKey(date: Date) {
  // NOTE: 한국 시간 기준으로 "오늘"이 바뀌어야 해요
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
