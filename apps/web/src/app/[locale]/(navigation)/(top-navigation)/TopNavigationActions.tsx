import type { PublicLocale } from '@litomi/domain/locale'

import { getTranslations } from 'next-intl/server'

import AutoHideHeader from '@/components/auto-hide/AutoHideHeader'

import LiveCamPromotionLink from './LiveCamPromotionLink'
import MobileNavigationButton from './MobileNavigationButton'
import NewMangaLink from './NewMangaLink'
import RandomMangaLink from './RandomMangaLink'
import RecommendMangaLink from './RecommendMangaLink'
import TorRecommendationLink from './TorRecommendationLink'

type Props = {
  locale: PublicLocale
}

export default async function TopNavigationActions({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'TopNavigation.actions' })

  return (
    <AutoHideHeader className="pointer-events-none sticky top-0 z-40 origin-top pt-[calc(0.75rem+var(--safe-area-top))] pb-2 transition data-[auto-hide=true]:scale-98">
      <nav
        aria-label={t('label')}
        className="pointer-events-auto mx-auto flex w-fit items-center gap-1 px-2 py-1 text-sm sm:mr-0 md:text-base rounded-3xl border border-foreground/15 bg-background/90 shadow backdrop-blur"
      >
        <MobileNavigationButton />
        <NewMangaLink />
        <RecommendMangaLink />
        <RandomMangaLink timer={20} />
        {/* <LiveCamPromotionLink /> */}
        <TorRecommendationLink />
      </nav>
    </AutoHideHeader>
  )
}
