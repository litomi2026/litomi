import { Flame } from 'lucide-react'
import Link from 'next/link'

import AutoHideHeader from '@/components/auto-hide/AutoHideHeader'
import LinkPending from '@/components/LinkPending'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '../(ranking)/common'
import MobileNavigationButton from './MobileNavigationButton'
import NewMangaLink from './NewMangaLink'
import RandomMangaLink from './RandomMangaLink'
import { LIVE_CAM_AD_URL, topNavigationActionClassName } from './topNavigationActionConfig'

export default function TopNavigationActions() {
  return (
    <AutoHideHeader className="sticky top-0 z-40 -mx-2 border-b border-zinc-800 bg-background/90 px-2 pt-[calc(0.5rem+var(--safe-area-top))] pb-2 backdrop-blur">
      <nav aria-label="빠른 이동" className="flex flex-wrap justify-center gap-2 text-sm sm:justify-end sm:text-base">
        <MobileNavigationButton />
        <a
          aria-label="라이브 섹스 캠 새 탭에서 열기"
          className={topNavigationActionClassName}
          href={LIVE_CAM_AD_URL}
          rel="noopener sponsored"
          target="_blank"
          title="라이브 섹스 캠"
        >
          라이브 섹스 캠
        </a>
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
        <NewMangaLink />
        <RandomMangaLink timer={20} />
      </nav>
    </AutoHideHeader>
  )
}
