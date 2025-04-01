import MangaCard from '@/components/card/MangaCard'
import IconInfo from '@/components/icons/IconInfo'
import Navigation from '@/components/Navigation'
import OrderToggleLink from '@/components/OrderToggleLink'
import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceToggleLink'
import Tooltip from '@/components/ui/Tooltip'
import { CANONICAL_URL } from '@/constants/url'
import { harpiMangaIdsByPage } from '@/database/harpi'
import { harpiMangaPages, harpiMangas } from '@/database/harpi'
import { BasePageProps } from '@/types/nextjs'
import { validateOrder, validatePage, validateSort } from '@/utils/param'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'error'

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas/id/desc/1/hp`,
    languages: { ko: `${CANONICAL_URL}/mangas/id/desc/1/hp` },
  },
}

export async function generateStaticParams() {
  const pageIndexes = Array.from({ length: 10 }, (_, i) => String(i + 1))
  return pageIndexes.map((page) => ({ sort: 'id', order: 'desc', page }))
}

export default async function Page({ params }: BasePageProps) {
  const { sort, order, page } = await params
  const sortString = validateSort(sort)
  const orderString = validateOrder(order)
  const pageNumber = validatePage(page)
  const totalPages = harpiMangaPages.length

  if (!sortString || !orderString || !pageNumber || pageNumber > totalPages) {
    notFound()
  }

  const currentMangaIds = harpiMangaIdsByPage[sortString][orderString][pageNumber - 1]
  const source = 'hp'

  return (
    <main className="grid gap-2">
      <div className="flex justify-end gap-2 flex-wrap whitespace-nowrap">
        <Tooltip position="bottom-right">
          <div className="flex items-center gap-1">
            <p className="text-xs md:text-sm">이미지가 안 보여요!</p>
            <IconInfo className="w-3 md:w-4" />
          </div>
          <div className="rounded-xl border-2 border-zinc-700 bg-background whitespace-pre-line p-3 text-sm max-w-xs">
            <p>
              hp 모드에선 브러우저 요청에 <code>referer</code> 헤더를 추가해야 이미지를 볼 수 있어요.
            </p>
            <hr className="text-zinc-500 my-3" />
            <p>
              (Desktop Chrome){' '}
              <a className="text-blue-500" href="https://modheader.com/" rel="noopener noreferrer" target="_blank">
                ModHeader
              </a>{' '}
              같은 확장 프로그램을 사용해서 <code>referer:https://pk3.harpi.in</code> 헤더를 추가해주세요.
            </p>
            <hr className="text-zinc-500 my-3" />
            <p>
              (Mobile) <code>referer:https://pk3.harpi.in</code> 헤더를 추가할 수 있는 브라우저를 사용해주세요. 저도
              방법을 찾고 싶어요..
            </p>
          </div>
        </Tooltip>
        <OrderToggleLink currentOrder={orderString} hrefPrefix="../../" hrefSuffix={`/${pageNumber}/${source}`} />
        <SourceSliderLink currentSource={source} />
        <ShuffleButton action="random" className="w-fit" href="/mangas/random/ha" iconClassName="w-5" />
      </div>
      <ul className="grid md:grid-cols-2 gap-2">
        {currentMangaIds.map((id, i) => (
          <MangaCard index={i} key={id} manga={harpiMangas[id]} source={source} />
        ))}
      </ul>
      <div className="flex justify-center overflow-x-auto scrollbar-hidden">
        <Navigation currentPage={pageNumber} totalPages={totalPages} />
      </div>
    </main>
  )
}
