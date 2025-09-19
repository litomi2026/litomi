import type { LayoutProps } from '@/types/nextjs'

import ShuffleButton from '@/components/ShuffleButton'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import ViewSliderLink from '@/components/ViewSliderLink'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex flex-col grow gap-2">
      <div className="flex flex-wrap justify-center gap-2 text-sm sm:justify-end sm:text-base">
        <ViewSliderLink />
        <ShuffleButton action="refresh" iconClassName="w-5" />
      </div>
      <div className="flex justify-center whitespace-nowrap">
        <SourceTooltip />
      </div>
      {children}
      <div className="flex justify-center items-center">
        <ShuffleButton action="refresh" iconClassName="w-5" />
      </div>
    </main>
  )
}
