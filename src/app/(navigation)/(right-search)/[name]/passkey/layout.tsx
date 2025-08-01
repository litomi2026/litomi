import type { LayoutProps } from '@/types/nextjs'

import PasskeyRegisterButton from './PasskeyRegisterButton'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex h-full flex-col bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-end/5 via-transparent to-transparent" />
        <div className="relative px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">패스키</h2>
              <p className="text-sm sm:text-base text-zinc-400">안전하고 빠른 로그인</p>
            </div>
            <div className="self-end sm:self-auto">
              <PasskeyRegisterButton />
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-brand-end/20 to-transparent" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </div>
    </main>
  )
}
