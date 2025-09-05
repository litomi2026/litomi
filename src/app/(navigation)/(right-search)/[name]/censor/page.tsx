import { Metadata } from 'next'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { getUserIdFromCookie } from '@/utils/cookie'

import Censorships from './Censorships'
import GuestView from './GuestView'

export const metadata: Metadata = {
  title: `검열 - ${SHORT_NAME}`,
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

export default async function CensorPage() {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return <GuestView />
  }

  return <Censorships />
}
