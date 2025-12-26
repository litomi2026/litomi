import type { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import PointsShop from './PointsShop'

export const metadata: Metadata = {
  title: '리보 상점',
  ...generateOpenGraphMetadata({
    title: '리보 상점',
    url: '/libo/shop',
  }),
  alternates: {
    canonical: '/libo/shop',
    languages: { ko: '/libo/shop' },
  },
}

export default function ShopPage() {
  return <PointsShop />
}
