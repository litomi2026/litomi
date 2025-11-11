import { Metadata } from 'next'
import { Suspense } from 'react'

import { generateOpenGraphMetadata } from '@/constants'

import Loading from './loading'
import SearchPage from './SearchPage'

export const metadata: Metadata = {
  title: '검색',
  ...generateOpenGraphMetadata({
    title: '검색',
    url: '/search',
  }),
  alternates: {
    canonical: '/search',
    languages: { ko: '/search' },
  },
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchPage />
    </Suspense>
  )
}
