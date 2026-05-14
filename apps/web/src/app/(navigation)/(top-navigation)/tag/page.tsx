import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import TagPageClient from './TagPageClient'

export const metadata: Metadata = {
  title: '태그',
  ...generateOpenGraphMetadata({
    title: '태그',
    url: '/tag',
  }),
  alternates: {
    canonical: '/tag',
    languages: { ko: '/tag' },
  },
}

export default function Page() {
  return <TagPageClient />
}
