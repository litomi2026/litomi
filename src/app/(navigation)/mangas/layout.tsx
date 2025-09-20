import Link from 'next/link'

import type { LayoutProps } from '@/types/nextjs'

import InstallPrompt from '@/components/InstallPrompt'
import ScrollButtons from '@/components/ScrollButtons'
import { SHORT_NAME } from '@/constants'

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col grow max-w-screen-2xl">
      <div className="flex flex-col grow p-2 gap-6">
        {children}
        <footer className="text-center grid gap-2 pb-4 text-sm">
          <InstallPrompt />
          <p>ⓒ 2025. {SHORT_NAME}. All rights reserved.</p>
          <div className="flex justify-center gap-2 flex-wrap text-xs">
            <Link className="hover:underline" href="/doc/terms">
              이용약관
            </Link>
            <Link className="hover:underline" href="/doc/privacy">
              개인정보처리방침
            </Link>
            <Link className="hover:underline" href="/deterrence">
              사용자 연령 제한 규정
            </Link>
            <a className="hover:underline" href="https://github.com/gwak2837/litomi/issues" target="_blank">
              이슈 제보
            </a>
          </div>
        </footer>
      </div>
      <ScrollButtons />
    </div>
  )
}
