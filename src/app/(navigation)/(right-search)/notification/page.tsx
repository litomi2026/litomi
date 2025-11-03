import { Bell } from 'lucide-react'
import { Metadata } from 'next'
import { Suspense } from 'react'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'

import NotificationList from './NotificationList'
import NotificationSettingsLink from './NotificationSettingsLink'

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
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 pb-4">
        <Bell className="size-9 p-2 bg-zinc-800/50 rounded-xl text-brand-end" />
        <div className="flex-1">
          <div className="w-full flex items-center justify-between gap-2">
            <h1 className="text-lg font-semibold text-foreground sm:text-xl">알림</h1>
            <NotificationSettingsLink />
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">새로운 작품과 업데이트 소식을 확인하세요</p>
        </div>
      </div>
      <Suspense>
        <NotificationList />
      </Suspense>
    </div>
  )
}
