import type { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import TransactionHistory from './TransactionHistory'

export const metadata: Metadata = {
  title: '리보 내역',
  ...generateOpenGraphMetadata({
    title: '리보 내역',
    url: '/libo/history',
  }),
  alternates: {
    canonical: '/libo/history',
    languages: { ko: '/libo/history' },
  },
}

export default function HistoryPage() {
  return <TransactionHistory />
}
