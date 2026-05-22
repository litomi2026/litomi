import AutoHideHeader from '@/components/auto-hide/AutoHideHeader'

import LiveCamPromotionLink from './LiveCamPromotionLink'
import MobileNavigationButton from './MobileNavigationButton'
import NewMangaLink from './NewMangaLink'
import NordVPNPromotionLink from './NordVPNPromotionLink'
import RandomMangaLink from './RandomMangaLink'

export default function TopNavigationActions() {
  return (
    <AutoHideHeader className="sticky top-0 z-40 -mx-2 border-b-2 border-background bg-background/90 px-2 pt-[calc(0.5rem+var(--safe-area-top))] pb-2 backdrop-blur">
      <nav aria-label="빠른 이동" className="flex flex-wrap justify-center gap-2 text-sm sm:justify-end md:text-base">
        <MobileNavigationButton />
        <NewMangaLink />
        <RandomMangaLink timer={20} />
        <LiveCamPromotionLink />
        <NordVPNPromotionLink />
      </nav>
    </AutoHideHeader>
  )
}
