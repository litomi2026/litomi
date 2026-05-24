import { getUserIdFromCookie } from '@litomi/auth/cookie'
import { SHORT_NAME } from '@litomi/domain/app/metadata'
import { Metadata } from 'next'

import { defaultOpenGraph } from '@/lib/metadata'

import Censorships from './Censorships'
import Unauthorized from './Unauthorized'

export const metadata: Metadata = {
  title: '검열',
  openGraph: {
    ...defaultOpenGraph,
    title: `검열 - ${SHORT_NAME}`,
    url: '/@/censor',
  },
  alternates: {
    canonical: '/@/censor',
    languages: { ko: '/@/censor' },
  },
}

export default async function Page() {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return <Unauthorized />
  }

  return <Censorships />
}
