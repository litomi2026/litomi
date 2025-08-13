import type { LayoutProps } from '@/types/nextjs'

import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceSliderLink'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import ViewSliderLink from '@/components/ViewSliderLink'
import { getTotalPages, SourceParam, validatePage, validateSource, validateView, ViewCookie } from '@/utils/param'

export default async function Layout({ params, children }: LayoutProps) {
  const { page, source, layout } = await params
  const pageNumber = validatePage(page) || 1
  const sourceString = validateSource(source)
  const viewString = validateView(layout) || ViewCookie.CARD
  const defaultSource = sourceString || SourceParam.HIYOBI

  return (
    <main className="flex flex-col gap-2 grow">
      <h1 className="sr-only">만화 목록</h1>
      <div className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm sm:justify-end md:text-base">
        <ViewSliderLink current={viewString} />
        <SourceSliderLink
          current={sourceString}
          hrefPrefixes={(source) => {
            if (source === SourceParam.HIYOBI) {
              return `../../../${Math.min(pageNumber, getTotalPages(source))}/`
            } else {
              return `../../${Math.min(pageNumber, getTotalPages(source))}/`
            }
          }}
          hrefSuffix={`/${viewString}`}
        />
        <ShuffleButton
          action="random"
          className="w-fit"
          href={`/mangas/random/${defaultSource}/${viewString}`}
          iconClassName="w-5"
        />
      </div>
      {sourceString && (
        <div className="flex justify-center whitespace-nowrap">
          <SourceTooltip />
        </div>
      )}
      {children}
    </main>
  )
}
