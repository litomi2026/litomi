import { SHORT_NAME } from '@litomi/domain/app/metadata'
import { Download } from 'lucide-react'

import ScrollButtons from '@/components/ScrollButtons'
import { MobileNavigationSpacer } from '@/components/ScrollSpacers'
import { Link } from '@/i18n/navigation'

import TopNavigationActions from './TopNavigationActions'

export default async function Layout({ children }: LayoutProps<'/[locale]'>) {
  return (
    <div className="flex flex-col flex-1 gap-2 px-2 pb-2">
      <TopNavigationActions />
      <main className="flex flex-col grow gap-2">{children}</main>
      <footer className="text-center grid gap-2 p-4 text-sm">
        <Link
          className="mx-auto text-foreground rounded-full border-2 border-brand-gradient hover:brightness-125 active:brightness-75 transition"
          href="/app"
          prefetch={false}
        >
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold">
            <Download className="size-5" />
            <span>앱 설치/다운로드</span>
          </div>
        </Link>
        <p>ⓒ 2025. {SHORT_NAME}. All rights reserved.</p>
        <div className="flex justify-center gap-2 gap-y-1 flex-wrap text-xs">
          <Link className="hover:underline" href="/doc/terms" prefetch={false}>
            이용약관
          </Link>
          <Link className="hover:underline" href="/doc/privacy" prefetch={false}>
            개인정보처리방침
          </Link>
          <Link className="hover:underline" href="/deterrence" prefetch={false}>
            사용자 연령 제한 규정
          </Link>
        </div>
        <div className="flex justify-center gap-2 gap-y-1 flex-wrap text-xs">
          <Link className="hover:underline" href="/doc/2257" prefetch={false}>
            2257 고지
          </Link>
          <Link className="hover:underline" href="/doc/dmca" prefetch={false}>
            저작권/DMCA
          </Link>
          <Link className="hover:underline" href="/doc/youth-protection" prefetch={false}>
            청소년보호정책
          </Link>
        </div>
      </footer>
      <MobileNavigationSpacer />
      <ScrollButtons />
    </div>
  )
}
