import type { LayoutProps } from '@/types/nextjs'

import IconShield from '@/components/icons/IconShield'

import PasskeyRegisterButton from './PasskeyRegisterButton'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex h-full flex-col">
      <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-900/80 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <IconShield className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold">패스키 관리</h1>
            </div>
            <p className="mt-2 text-sm text-zinc-400">생체 인증으로 더 안전하고 빠르게 로그인하세요</p>
          </div>
          <PasskeyRegisterButton />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </main>
  )
}
