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
    <AutoHideHeader className="sticky top-0 z-40 -mx-2 border-b-2 border-background bg-background/90 px-2 pt-[calc(0.5rem+var(--safe-area-top))] pb-2 backdrop-blur">
      <nav aria-label={t('label')} className="flex flex-wrap justify-center gap-2 text-sm sm:justify-end md:text-base">
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
