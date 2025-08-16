import type { LayoutProps } from '@/types/nextjs'

import PasskeyRegisterButton from './PasskeyRegisterButton'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex h-full flex-col bg-background">
      <h2 className="sr-only">패스키</h2>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-end/5 via-transparent to-transparent" />
        <div className="relative flex justify-end px-4 py-6 sm:px-6 sm:py-8">
          <PasskeyRegisterButton />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-brand-end/20 to-transparent" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </div>
    </main>
  )
}
