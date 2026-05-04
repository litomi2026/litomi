'use client'

import { Settings } from 'lucide-react'

import useMeQuery from '@/query/useMeQuery'

export default function NotificationSettingsLink() {
  const { data: me } = useMeQuery()
  const username = me?.name ?? ''

  return (
    <a
      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition"
      href={`/@${username}/settings#keyword`}
      title="알림 설정"
    >
      <Settings className="w-5 h-5" />
    </a>
  )
}
