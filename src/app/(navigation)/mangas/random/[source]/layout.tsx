import type { BaseLayoutProps } from '@/types/nextjs'

import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceToggleLink'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import { SourceParam, validateSource } from '@/utils/param'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { source } = await params
  const sourceString = validateSource(source)

  return (
    <main className="flex flex-col grow gap-2">
      <div className="flex justify-end gap-2 text-sm sm:text-base">
        <SourceSliderLink currentSource={sourceString} />
        <ShuffleButton
          action="refresh"
          href={`/mangas/random/${sourceString || SourceParam.HIYOBI}`}
          iconClassName="w-5"
        />
      </div>
      {sourceString && (
        <div className="flex justify-center whitespace-nowrap">
          <SourceTooltip disabled={sourceString === SourceParam.K_HENTAI} source={sourceString} />
        </div>
      )}
      {children}
    </main>
  )
}
