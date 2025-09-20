import type { LayoutProps } from '@/types/nextjs'

import RandomMangaLink from '@/app/(navigation)/(top-navigation)/RandomMangaLink'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import ViewSliderLink from '@/components/ViewSliderLink'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex flex-col grow gap-2">
      <div className="flex flex-wrap justify-center gap-2 text-sm sm:justify-end sm:text-base">
        <ViewSliderLink />
        <RandomMangaLink />
      </div>
      <div className="flex justify-center whitespace-nowrap">
        <SourceTooltip />
      </div>
      {children}
      <div className="flex justify-center items-center">
        <RandomMangaLink />
      </div>
    </main>
  )
}
