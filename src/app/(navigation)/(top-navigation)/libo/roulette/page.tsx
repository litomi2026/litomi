import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import RoulettePageClient from './roulette-page-client'

export const metadata: Metadata = {
  title: '룰렛',
  ...generateOpenGraphMetadata({
    title: '룰렛',
    url: '/libo/roulette',
  }),
  alternates: {
    canonical: '/libo/roulette',
    languages: { ko: '/libo/roulette' },
  },
}

export default function RoulettePage() {
  return <RoulettePageClient />
}
