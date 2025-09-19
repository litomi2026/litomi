import { Metadata } from 'next'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: `신작 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `신작 - ${SHORT_NAME}`,
    url: '/mangas/new',
  },
  alternates: {
    canonical: '/mangas/new',
    languages: { ko: '/mangas/new' },
  },
}

export default function Page() {
  return <div>Page</div>
}
