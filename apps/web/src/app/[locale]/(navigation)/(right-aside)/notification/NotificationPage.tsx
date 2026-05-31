'use client'

import { TopStickySafeAreaSurface } from '@/components/SafeAreaSurface'

import NotificationHeader from './NotificationHeader'
import NotificationList from './NotificationList'
import { NotificationProvider } from './NotificationProvider'

export default function NotificationPage() {
  return (
    <NotificationProvider>
      <TopStickySafeAreaSurface />
      <NotificationHeader />
      <NotificationList />
    </NotificationProvider>
  )
}
