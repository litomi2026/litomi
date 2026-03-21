import { Metadata } from 'next'

import JuicyAdsScript from '@/components/ads/juicy-ads/JuicyAdsScript'
import { generateOpenGraphMetadata } from '@/constants'

import RewardedAdSection from './RewardedAdSection'

export const metadata: Metadata = {
  title: '리보',
  ...generateOpenGraphMetadata({
    title: '리보',
    url: '/libo',
  }),
  alternates: {
    canonical: '/libo',
    languages: { ko: '/libo' },
  },
}

export default function PointsPage() {
  return (
    <>
      <JuicyAdsScript />
      <RewardedAdSection />
    </>
  )
}
