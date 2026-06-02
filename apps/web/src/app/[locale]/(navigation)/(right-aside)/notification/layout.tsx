import { Settings } from 'lucide-react'

import IconBell from '@/components/icons/IconBell'
import { Link } from '@/i18n/navigation'

export default function Layout({ children }: LayoutProps<'/[locale]/notification'>) {
  return (
    <>
      <div className="flex items-center gap-3 p-4 pt-safe mt-4">
        <IconBell className="size-9 p-2 bg-zinc-800/50 rounded-xl text-brand" />
        <div className="flex-1">
          <div className="w-full flex items-center justify-between gap-2">
            <h1 className="text-lg font-semibold text-foreground sm:text-xl">알림</h1>
            <Link
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition"
              href="/settings#keyword"
              title="알림 설정"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">새로운 작품과 업데이트 소식을 확인하세요</p>
        </div>
      </div>
      {children}
    </>
  )
}
