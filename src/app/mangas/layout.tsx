import type { BaseLayoutProps } from '@/types/nextjs'

import InstallPrompt from '@/components/InstallPrompt'
import ScrollButtons from '@/components/ScrollButtons'
import { SHORT_NAME } from '@/constants'
import Link from 'next/link'

export default function Layout({ children }: BaseLayoutProps) {
  return (
    <div className="px-safe pb-safe min-h-dvh max-w-screen-xl mx-auto">
      <div className="p-2">
        {children}
        <footer className="text-center py-4 grid gap-2">
          <InstallPrompt />
          <p>ⓒ 2025. {SHORT_NAME}. All rights reserved.</p>
          <div className="flex justify-center text-sm">
            <a
              className="flex items-center gap-2 hover:underline"
              href="https://t.me/litomi_official"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg className="w-4" viewBox="0 0 448 512">
                <path
                  d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z"
                  fill="currentColor"
                />
              </svg>
              @litomi_official
            </a>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            <Link className="hover:underline text-xs" href="/doc/terms">
              이용약관
            </Link>
            <Link className="hover:underline text-xs" href="/doc/privacy">
              개인정보처리방침
            </Link>
            <Link className="hover:underline text-xs" href="/deterrence">
              사용자 연령 제한 규정
            </Link>
          </div>
        </footer>
      </div>
      <ScrollButtons />
    </div>
  )
}
