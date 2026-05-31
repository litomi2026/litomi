'use client'

import { Settings } from 'lucide-react'

export default function NotificationSettingsLink() {
  return (
    <a
      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition"
      href="/settings#keyword"
      title="알림 설정"
    >
      <Settings className="w-5 h-5" />
    </a>
  )
}
