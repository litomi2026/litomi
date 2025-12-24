import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import PointsPageClient from './PointsPageClient'

export const metadata: Metadata = {
  title: '리보',
  ...generateOpenGraphMetadata({
    title: '리보',
  }),
}

export default function PointsPage() {
  return <PointsPageClient />
}


