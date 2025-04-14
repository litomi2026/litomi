import type { BaseLayoutProps } from '@/types/nextjs'

import LayoutSliderLink from '@/components/LayoutSliderLink'
import ShuffleButton from '@/components/ShuffleButton'
import SortSliderLink from '@/components/SortSliderLink'
import SourceSliderLink from '@/components/SourceSliderLink'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import {
  getTotalPages,
  LayoutParam,
  SortParam,
  SourceParam,
  validateLayout,
  validatePage,
  validateSort,
  validateSource,
} from '@/utils/param'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { sort, page, source, layout } = await params
  const sortString = validateSort(sort)
  const pageNumber = validatePage(page) || 1
  const sourceString = validateSource(source)
  const layoutString = validateLayout(layout) || LayoutParam.CARD
  const defaultSource = sourceString || SourceParam.HIYOBI

  return (
    <main className="flex flex-col gap-2 grow">
      <h1 className="sr-only">만화 목록</h1>
      <div className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm sm:justify-end md:text-base">
        <SortSliderLink
          currentSort={sortString}
          disabled={sourceString === SourceParam.HIYOBI}
          hrefPrefix="../../../"
          hrefSuffix={`/${pageNumber}/${defaultSource}/${layoutString}`}
        />
        <LayoutSliderLink current={layoutString} />
        <SourceSliderLink
          current={sourceString}
          hrefPrefixes={(source) => {
            if (source === SourceParam.HIYOBI) {
              return `../../../${SortParam.LATEST}/${Math.min(pageNumber, getTotalPages(source))}/`
            } else {
              return `../../${Math.min(pageNumber, getTotalPages(source))}/`
            }
          }}
          hrefSuffix={`/${layoutString}`}
        />
        <ShuffleButton
          action="random"
          className="w-fit"
          href={`/mangas/random/${defaultSource}/${layoutString}`}
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
