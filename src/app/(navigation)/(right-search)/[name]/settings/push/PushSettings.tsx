import { sql } from 'drizzle-orm'
import { Bell, Settings, Smartphone } from 'lucide-react'

import { db } from '@/database/drizzle'
import { pushSettingsTable, webPushTable } from '@/database/schema'

import BrowserList from './BrowserList'
import PushSettingsForm from './PushSettingsForm'
import PushSubscriptionToggle from './PushSubscriptionToggle'
import PushTestButton from './PushTestButton'

type Props = {
  userId: string
}

export default async function PushSettings({ userId }: Props) {
  const { settings, endpoints, webPushes } = await getPushSettings(userId)

  return (
    <div className="space-y-10">
      <label className="block cursor-pointer bg-gradient-to-br from-brand-start/10 to-brand-end/10 rounded-xl p-4 sm:p-6 border border-brand-end/20">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-brand-end flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold truncate">브라우저 푸시 알림</h3>
          </div>
          <PushSubscriptionToggle endpoints={endpoints} />
        </div>
        <p className="text-sm text-zinc-400">
          새로운 만화가 업데이트되면 이 브라우저에 실시간으로 알려드려요{' '}
          <a
            className="text-xs font-medium text-brand-end hover:underline"
            href="https://caniuse.com/push-api"
            rel="noopener noreferrer"
            target="_blank"
          >
            (지원 브라우저)
          </a>
        </p>
        <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-zinc-700">
          <div className="text-sm text-zinc-500">알림이 제대로 작동하는지 확인해보세요</div>
          <PushTestButton endpoints={endpoints} />
        </div>
      </label>
      <div className="flex items-center gap-3 mb-4">
        <Smartphone className="w-5 h-5 text-zinc-400" />
        <h3 className="font-medium text-base">브라우저 관리</h3>
      </div>
      <BrowserList webPushes={webPushes} />
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-5 h-5 text-zinc-400" />
        <h3 className="font-medium text-base">알림 설정</h3>
      </div>
      <PushSettingsForm initialSettings={settings} />
    </div>
  )
}

async function getPushSettings(userId: string) {
  const [[settings], webPushes] = await Promise.all([
    db
      .select({
        quietEnabled: pushSettingsTable.quietEnabled,
        quietStart: pushSettingsTable.quietStart,
        quietEnd: pushSettingsTable.quietEnd,
        batchEnabled: pushSettingsTable.batchEnabled,
        maxDaily: pushSettingsTable.maxDaily,
      })
      .from(pushSettingsTable)
      .where(sql`${pushSettingsTable.userId} = ${userId}`),
    db
      .select({
        id: webPushTable.id,
        endpoint: webPushTable.endpoint,
        userAgent: webPushTable.userAgent,
        createdAt: webPushTable.createdAt,
      })
      .from(webPushTable)
      .where(sql`${webPushTable.userId} = ${userId}`),
  ])

  return {
    settings: settings || DEFAULT_PUSH_SETTINGS,
    webPushes,
    endpoints: webPushes.map(({ endpoint }) => endpoint),
  }
}

const DEFAULT_PUSH_SETTINGS = {
  quietEnabled: true,
  quietStart: 22,
  quietEnd: 7,
  batchEnabled: true,
  maxDaily: 10,
}
