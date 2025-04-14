import type { BaseLayoutProps } from '@/types/nextjs'

import ShuffleButton from '@/components/ShuffleButton'
import SortToggleLink from '@/components/SortToggleLink'
import SourceSliderLink from '@/components/SourceToggleLink'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import { getTotalPages, SourceParam, validatePage, validateSort, validateSource } from '@/utils/param'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { sort, page, source } = await params
  const sortString = validateSort(sort)
  const pageNumber = validatePage(page)
  const sourceString = validateSource(source)

  return (
    <main className="flex flex-col gap-2 grow">
      <div
        className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm 
          sm:justify-end sm:flex-nowrap md:text-base"
      >
        <SortToggleLink
          currentSort={sortString}
          disabled={sourceString === SourceParam.HIYOBI}
          hrefPrefix="../../"
          hrefSuffix={`/${pageNumber || 1}/${sourceString || SourceParam.HIYOBI}`}
        />
        <SourceSliderLink
          currentSource={sourceString}
          hrefPrefixes={(source) => `../${Math.min(pageNumber || 1, getTotalPages(source))}/`}
        />
        <ShuffleButton
          action="random"
          className="w-fit"
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
