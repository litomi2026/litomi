import type { BaseLayoutProps } from '@/types/nextjs'

import IconInfo from '@/components/icons/IconInfo'
import Navigation from '@/components/Navigation'
import OrderToggleLink from '@/components/OrderToggleLink'
import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceToggleLink'
import Tooltip from '@/components/ui/Tooltip'
import { harpiMangaPages } from '@/database/harpi'
import { hashaMangaPages } from '@/database/hasha'
import { validateOrder, validatePage, validateSort, validateSource } from '@/utils/param'
import { notFound } from 'next/navigation'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { sort, order, page, source } = await params
  const sortString = validateSort(sort)
  const orderString = validateOrder(order)
  const pageNumber = validatePage(page)
  const sourceString = validateSource(source)
  const totalPages = getTotalPages(sourceString)

  if (!sortString || !orderString || !pageNumber || pageNumber > totalPages || !sourceString) {
    notFound()
  }

  return (
    <main className="grid gap-2">
      <div
        className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm 
          sm:justify-end sm:flex-nowrap md:text-base"
      >
        <OrderToggleLink
          currentOrder={orderString}
          disabled={sourceString === 'hi'}
          hrefPrefix="../../"
          hrefSuffix={`/${pageNumber}/${sourceString}`}
        />
        <SourceSliderLink currentSource={sourceString} />
        <ShuffleButton action="random" className="w-fit" href={`/mangas/random/${sourceString}`} iconClassName="w-5" />
      </div>
      <div className="flex justify-center whitespace-nowrap">
        <Tooltip position="bottom">
          <div className="flex items-center gap-1">
            <p className="text-xs md:text-sm">이미지가 안 보여요!</p>
            <IconInfo className="w-3 md:w-4" />
          </div>
          <>
            {sourceString === 'hp' && <HarpiTooltip />}
            {sourceString === 'ha' && <HashaTooltip />}
            {sourceString === 'hi' && <HiyobiTooltip />}
          </>
        </Tooltip>
      </div>
      {children}
      <div className="flex justify-center overflow-x-auto scrollbar-hidden">
        <Navigation currentPage={pageNumber} hrefPrefix="../" hrefSuffix={`/${sourceString}`} totalPages={totalPages} />
      </div>
    </main>
  )
}

function getTotalPages(source: string) {
  switch (source) {
    case 'ha':
      return hashaMangaPages.length
    case 'hi':
      return 7200
    case 'hp':
      return harpiMangaPages.length
    default:
      return 0
  }
}

function HarpiTooltip() {
  return (
    <div className="rounded-xl border-2 border-zinc-700 bg-background whitespace-pre-line p-3 text-sm max-w-xs">
      <p>
        hp 모드에선 브러우저 요청에 <code>referer</code> 헤더를 추가해야 이미지를 볼 수 있어요. 현재 더 편한 방법을 찾고
        있어요.
      </p>
      <hr className="text-zinc-500 my-3" />
      <p>
        (Desktop Chrome)
        <br />
        <a className="text-blue-500" href="https://modheader.com/" rel="noopener noreferrer" target="_blank">
          ModHeader
        </a>{' '}
        확장 프로그램을 사용해서 <code>referer: https://pk3.harpi.in</code> 헤더를 추가해주세요.
      </p>
      <hr className="text-zinc-500 my-3" />
      <p>
        (Mobile) <code>referer: https://pk3.harpi.in</code> 헤더를 추가할 수 있는 브라우저를 사용해주세요.
      </p>
    </div>
  )
}

function HashaTooltip() {
  return (
    <div className="rounded-xl border-2 border-zinc-700 bg-background whitespace-pre-line p-3 text-sm min-w-3xs max-w-xs">
      <p>
        ha 모드에서 간헐적으로 이미지 서버에서 HTTP 523 Origin Is Unreachable (원본에 도달할 수 없음) 오류 응답을
        내려주는 경우가 있어요. 현재 확인 중이에요.
      </p>
    </div>
  )
}

function HiyobiTooltip() {
  return (
    <div className="rounded-xl border-2 border-zinc-700 bg-background whitespace-pre-line p-3 text-sm min-w-3xs max-w-xs">
      <p>hi 모드에서 간헐적으로 와이파이 네트워크일 때만 이미지가 보이지 않는 이슈가 있어요. 현재 확인 중이에요.</p>
    </div>
  )
}
