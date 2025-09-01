import { Metadata } from 'next'
import { Suspense } from 'react'

import IconBell from '@/components/icons/IconBell'
import IconLock from '@/components/icons/IconLock'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { getUserIdFromCookie } from '@/utils/session'

import NotificationList from './NotificationList'
import NotificationSettingsLink from './NotificationSettingsLink'

export const metadata: Metadata = {
  title: `알림 - ${SHORT_NAME}`,
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
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <IconLock className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">로그인이 필요해요</h2>
          <p className="text-sm text-zinc-400">알림을 확인하려면 먼저 로그인해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 pb-4">
        <IconBell className="w-9 p-2 bg-zinc-800/50 rounded-xl text-brand-end" />
        <div className="flex-1">
          <div className="w-full flex items-center justify-between gap-2">
            <h1 className="text-lg font-semibold text-white sm:text-xl">알림</h1>
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
