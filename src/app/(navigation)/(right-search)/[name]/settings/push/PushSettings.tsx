import { eq } from 'drizzle-orm'
import { Bell, Settings, Smartphone } from 'lucide-react'

import { db } from '@/database/supabase/drizzle'
import { pushSettingsTable, webPushTable } from '@/database/supabase/notification'

import BrowserList from './BrowserList'
import PushSettingsForm from './PushSettingsForm'
import PushSubscriptionToggle from './PushSubscriptionToggle'
import PushTestButton from './PushTestButton'

type Props = {
  userId: number
}

export default async function PushSettings({ userId }: Props) {
  const { settings, endpoints, webPushes } = await getPushSettings(userId)

  return (
    <div className="space-y-8 sm:space-y-12 max-w-2xl mx-auto">
      <div className="relative bg-linear-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-4 sm:p-5 border border-zinc-700/50 hover:border-brand/30 transition-all overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-tr from-brand-start/5 via-transparent to-brand/5 pointer-events-none" />
        <div className="flex items-center gap-4 flex-1">
          <Bell className="size-5 shrink-0 text-brand p-2.5 bg-brand/10 rounded-xl border border-brand/20 box-content" />
          <div className="flex-1">
            <div className="flex-1 flex items-center justify-between gap-1">
              <h3 className="text-lg font-semibold text-zinc-100">브라우저 푸시</h3>
              <PushSubscriptionToggle endpoints={endpoints} />
            </div>
            <p className="text-xs text-zinc-500">
              <span className="hidden sm:inline">최신 브라우저에서 사용 가능 • </span>
              <a
                className="inline-flex items-center gap-1 text-brand/70 hover:text-brand transition-colors font-medium"
                href="https://caniuse.com/push-api"
                rel="noopener noreferrer"
                target="_blank"
              >
                지원 현황
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </a>
            </p>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-zinc-700/50 flex items-center justify-end gap-4">
          <PushTestButton endpoints={endpoints} />
        </div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <Smartphone className="size-4 shrink-0 text-zinc-400 p-2 bg-zinc-800/50 rounded-lg box-content" />
        <h3 className="text-sm font-semibold text-zinc-200">브라우저 관리</h3>
      </div>
      <BrowserList webPushes={webPushes} />
      <div className="flex items-center gap-3 mb-4">
        <Settings className="size-4 shrink-0 text-zinc-400 p-2 bg-zinc-800/50 rounded-lg box-content" />
        <h3 className="text-sm font-semibold text-zinc-200">알림 설정</h3>
      </div>
      <PushSettingsForm initialSettings={settings} />
    </div>
  )
}

async function getPushSettings(userId: number) {
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
      .where(eq(pushSettingsTable.userId, userId)),
    db
      .select({
        id: webPushTable.id,
        endpoint: webPushTable.endpoint,
        userAgent: webPushTable.userAgent,
        createdAt: webPushTable.createdAt,
      })
      .from(webPushTable)
      .where(eq(webPushTable.userId, userId)),
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
