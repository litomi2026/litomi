import { Metadata } from 'next'
import { cookies } from 'next/headers'

import { CANONICAL_URL, defaultOpenGraph, SHORT_NAME } from '@/constants'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import Censorships from './Censorships'
import GuestView from './GuestView'

export const metadata: Metadata = {
  title: `검열 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `검열 - ${SHORT_NAME}`,
    url: `${CANONICAL_URL}/@/censor`,
  },
}

export default async function CensorPage() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  if (!userId) {
    return <GuestView />
  }

  return <Censorships />
}
