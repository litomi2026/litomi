import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/lib/metadata'

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
  const nativeGridSponsor = getNativeGridSponsor(nativeGridSponsorPlacement.RANDOM)

  return <RandomMangaList nativeGridSponsor={nativeGridSponsor} />
}
