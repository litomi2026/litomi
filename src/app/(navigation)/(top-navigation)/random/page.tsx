import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import RandomMangaList from './RandomMangaList'

export const metadata: Metadata = {
  title: '랜덤',
  ...generateOpenGraphMetadata({
    title: '랜덤',
    url: '/random',
  }),
  alternates: {
    canonical: '/random',
    languages: { ko: '/random' },
  },
}

export default function Page() {
  return <RandomMangaList />
}
