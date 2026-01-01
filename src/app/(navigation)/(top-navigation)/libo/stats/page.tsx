import type { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import AdStats from './AdStats'

export const metadata: Metadata = {
  title: '광고 수익 통계',
  ...generateOpenGraphMetadata({
    title: '광고 수익 통계',
    url: '/libo/stats',
  }),
  alternates: {
    canonical: '/libo/stats',
    languages: { ko: '/libo/stats' },
  },
}

export default function LiboStatsPage() {
  return <AdStats />
}
