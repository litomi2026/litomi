import { Flame, ShieldCheck, Webcam } from 'lucide-react'
import Link from 'next/link'

import AutoHideHeader from '@/components/auto-hide/AutoHideHeader'
import LinkPending from '@/components/LinkPending'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '../(ranking)/common'
import MobileNavigationButton from './MobileNavigationButton'
import NewMangaLink from './NewMangaLink'
import RandomMangaLink from './RandomMangaLink'
import { LIVE_CAM_AD_URL, NORDVPN_AFFILIATE_URL, topNavigationActionClassName } from './topNavigationActionConfig'

export default function TopNavigationActions() {
  return (
    <AutoHideHeader className="sticky top-0 z-40 -mx-2 border-b border-background bg-background/90 px-2 pt-[calc(0.5rem+var(--safe-area-top))] pb-2 backdrop-blur">
      <nav aria-label="빠른 이동" className="flex flex-wrap justify-center gap-2 text-sm sm:justify-end md:text-base">
        <MobileNavigationButton />
        <NewMangaLink />
        <Link
          className={topNavigationActionClassName}
          href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`}
          prefetch={false}
        >
          <LinkPending className="size-5">
            <Flame className="size-5" />
          </LinkPending>{' '}
          <span className="hidden sm:inline">인기</span>
        </Link>
        <RandomMangaLink timer={20} />
        <a
          className={topNavigationActionClassName}
          href={LIVE_CAM_AD_URL}
          rel="noopener sponsored"
          target="_blank"
          title="라이브 섹스 캠"
        >
          <Webcam className="size-5 hidden sm:block" />
          라이브 섹스 캠
        </a>
        <a
          className={`${topNavigationActionClassName} relative`}
          href={NORDVPN_AFFILIATE_URL}
          rel="noopener noreferrer sponsored"
          target="_blank"
          title="[광고] 이 콘텐츠는 NordVPN 제휴 링크를 포함하고 있으며, 가입이 발생하면 일정 수수료를 지급받을 수 있습니다."
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 -right-1 rounded-full border border-zinc-700 bg-background/95 px-1.5 text-[10px] leading-4 font-medium text-zinc-400"
          >
            제휴
          </span>
          <ShieldCheck className="size-5" />
          <span className="hidden sm:inline">NordVPN</span>
        </a>
      </nav>
    </AutoHideHeader>
  )
}
