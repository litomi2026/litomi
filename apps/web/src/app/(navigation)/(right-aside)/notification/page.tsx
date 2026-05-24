import { SHORT_NAME } from '@litomi/domain/app/metadata'
import { Metadata } from 'next'
import { Suspense } from 'react'

import { defaultOpenGraph } from '@/lib/metadata'

import NotificationList from './NotificationList'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: '알림',
  openGraph: {
    ...defaultOpenGraph,
    title: `알림 - ${SHORT_NAME}`,
    url: '/notification',
  },
  alternates: {
    canonical: '/notification',
    languages: { ko: '/notification' },
  },
}

export default async function Page() {
  return (
    <Suspense>
      <NotificationList />
    </Suspense>
  )
}
