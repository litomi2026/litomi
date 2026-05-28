import { SHORT_NAME } from '@litomi/domain/app/metadata'
import { Metadata } from 'next'

import { defaultOpenGraph } from '@/lib/metadata'

import RecommendMangaPageClient from './RecommendMangaPageClient'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: '추천 작품',
  openGraph: {
    ...defaultOpenGraph,
    title: `추천 작품 - ${SHORT_NAME}`,
    url: '/recommend/manga',
  },
  alternates: {
    canonical: '/recommend/manga',
    languages: { ko: '/recommend/manga' },
  },
}

export default async function Page() {
  return <RecommendMangaPageClient />
}
