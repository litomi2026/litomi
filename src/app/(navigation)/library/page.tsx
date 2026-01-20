import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import AllLibraryMangaView from './AllLibraryMangaView'

export const metadata: Metadata = {
  title: '공개 서재',
  ...generateOpenGraphMetadata({
    title: '공개 서재',
    url: '/library',
  }),
  alternates: {
    canonical: '/library',
    languages: { ko: '/library' },
  },
}

export default function LibraryPage() {
  return (
    <main className="flex-1">
      <AllLibraryMangaView />
    </main>
  )
}
