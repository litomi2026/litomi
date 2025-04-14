import type { BaseLayoutProps } from '@/types/nextjs'

import LayoutSliderLink from '@/components/LayoutSliderLink'
import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceSliderLink'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import { LayoutParam, SourceParam, validateLayout, validateSource } from '@/utils/param'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { source, layout } = await params
  const sourceString = validateSource(source)
  const layoutString = validateLayout(layout) || LayoutParam.CARD

  return (
    <main className="flex flex-col grow gap-2">
      <div className="flex justify-end gap-2 text-sm sm:text-base">
        <LayoutSliderLink current={layoutString} />
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
