import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { nativeGridSponsorPlacement } from '@litomi/contracts'
import { generateOpenGraphMetadata } from '@litomi/domain/constants'
import { Metadata } from 'next'

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
