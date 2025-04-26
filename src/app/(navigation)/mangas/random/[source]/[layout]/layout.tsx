import type { BaseLayoutProps } from '@/types/nextjs'

import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceSliderLink'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import ViewSliderLink from '@/components/ViewSliderLink'
import { SourceParam, validateSource, validateView, ViewParam } from '@/utils/param'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { source, layout } = await params
  const sourceString = validateSource(source)
  const layoutString = validateView(layout) || ViewParam.CARD

  return (
    <main className="flex flex-col grow gap-2">
      <div className="flex flex-wrap justify-center gap-2 text-sm sm:justify-end sm:text-base">
        <ViewSliderLink current={layoutString} />
        <SourceSliderLink current={sourceString} hrefPrefixes={() => '../'} hrefSuffix={`/${layoutString}`} />
        <ShuffleButton action="refresh" iconClassName="w-5" />
      </div>
      {sourceString && (
        <div className="flex justify-center whitespace-nowrap">
          <SourceTooltip disabled={sourceString === SourceParam.K_HENTAI} source={sourceString} />
        </div>
      )}
      {children}
      <div className="flex justify-center items-center">
        <ShuffleButton action="refresh" iconClassName="w-5" />
      </div>
    </main>
  )
}
