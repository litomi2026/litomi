import { Download, Flame } from 'lucide-react'
import Link from 'next/link'

import LinkPending from '@/components/LinkPending'
import ScrollButtons from '@/components/ScrollButtons'
import { SHORT_NAME } from '@/constants'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '../(ranking)/common'
import MobileNavigationButton from './MobileNavigationButton'
import NewMangaLink from './NewMangaLink'
import RandomMangaLink from './RandomMangaLink'

export default async function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex flex-col flex-1 gap-2 p-2">
      <div className="flex flex-wrap justify-center gap-2 text-sm sm:justify-end sm:text-base">
        <MobileNavigationButton />
        <Link
          className="flex items-center gap-2 p-2 px-3 rounded-xl transition border-2 text-foreground hover:bg-zinc-900"
          href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`}
          prefetch={false}
        >
          <LinkPending className="size-5">
            <Flame className="size-5" />
          </LinkPending>{' '}
          인기
        </Link>
        <NewMangaLink />
        <RandomMangaLink timer={20} />
      </div>
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
          <Link className="hover:underline" href="/doc/dmca" prefetch={false}>
            저작권/DMCA
          </Link>
          <Link className="hover:underline" href="/deterrence" prefetch={false}>
            사용자 연령 제한 규정
          </Link>
        </div>
      </footer>
      <ScrollButtons />
    </div>
  )
}
