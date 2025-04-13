import type { BaseLayoutProps } from '@/types/nextjs'

import OrderToggleLink from '@/components/OrderToggleLink'
import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceToggleLink'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import { harpiMangaPages } from '@/database/harpi'
import { hashaMangaPages } from '@/database/hasha'
import { getTotalPages, SourceParam, validateOrder, validatePage, validateSource } from '@/utils/param'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { order, page, source } = await params
  const orderString = validateOrder(order)
  const pageNumber = validatePage(page)
  const sourceString = validateSource(source)

  return (
    <main className="flex flex-col gap-2 grow">
      <div
        className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm 
          sm:justify-end sm:flex-nowrap md:text-base"
      >
        <OrderToggleLink
          currentOrder={orderString}
          disabled={sourceString === SourceParam.HIYOBI || sourceString === SourceParam.K_HENTAI}
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
          <SourceTooltip source={sourceString} />
        </div>
      )}
      {children}
    </main>
  )
}
