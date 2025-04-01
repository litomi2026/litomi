import type { BaseLayoutProps } from '@/types/nextjs'

import HarpiTooltip from '@/components/HarpiTooltip'
import Navigation from '@/components/Navigation'
import OrderToggleLink from '@/components/OrderToggleLink'
import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceToggleLink'
import { harpiMangaPages } from '@/database/harpi'
import { validateOrder, validatePage, validateSort, validateSource } from '@/utils/param'
import { notFound } from 'next/navigation'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { sort, order, page, source } = await params
  const sortString = validateSort(sort)
  const orderString = validateOrder(order)
  const pageNumber = validatePage(page)
  const sourceString = validateSource(source)
  const totalPages = harpiMangaPages.length

  if (!sortString || !orderString || !pageNumber || pageNumber > totalPages || !sourceString) {
    notFound()
  }

  return (
    <main className="grid gap-2">
      <div
        className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm 
          sm:justify-end sm:flex-nowrap md:text-base"
      >
        <OrderToggleLink currentOrder={orderString} hrefPrefix="../../" hrefSuffix={`/${pageNumber}/${sourceString}`} />
        <div className="flex gap-2">
          <SourceSliderLink currentSource={sourceString} />
          <ShuffleButton
            action="random"
            className="w-fit"
            href={`/mangas/random/${sourceString}`}
            iconClassName="w-5"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 flex-wrap whitespace-nowrap"></div>
      <div className="flex justify-center whitespace-nowrap">
        <HarpiTooltip position="bottom" />
      </div>
      {children}
      <div className="flex justify-center overflow-x-auto scrollbar-hidden">
        <Navigation currentPage={pageNumber} totalPages={totalPages} />
      </div>
    </main>
  )
}
