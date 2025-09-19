import { Metadata } from 'next'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: `인기 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `인기 - ${SHORT_NAME}`,
    url: '/mangas/top',
  },
  alternates: {
    canonical: '/mangas/top',
    languages: { ko: '/mangas/top' },
  },
}

export default function Page() {
  return <div>Page</div>
}
