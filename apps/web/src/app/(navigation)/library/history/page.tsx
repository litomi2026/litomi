import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/lib/metadata'

import HistoryPageClient from './HistoryPageClient'

export const metadata: Metadata = {
  title: '감상 기록',
  ...generateOpenGraphMetadata({
    title: '감상 기록',
    url: '/library/history',
  }),
  alternates: {
    canonical: '/library/history',
    languages: { ko: '/library/history' },
  },
}

export default function HistoryPage() {
  return (
    <main className="flex-1 flex flex-col">
      <HistoryPageClient />
    </main>
  )
}
