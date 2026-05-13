import { useEffect, useEffectEvent } from 'react'

import { useReaderStore } from './store/reader'

const PAGE_SEARCH_PARAM_COMMIT_DELAY_MS = 200

type Params = {
  enabled: boolean
  getScrollRowIndex: (pageIndex: number) => number
  maxIndex: number
  pageSearchParam: string
}

export default function usePageSearchParamSync({ enabled, getScrollRowIndex, maxIndex, pageSearchParam }: Params) {
  const pageIndex = useReaderStore((state) => state.pageIndex)
  const navigateToPageIndex = useReaderStore((state) => state.navigateToPageIndex)
  const getInitialScrollRowIndex = useEffectEvent((pageIndex: number) => getScrollRowIndex(pageIndex))

  // NOTE: page search param이 있으면 초기 진입 시 해당 페이지로 이동해요.
  useEffect(() => {
    if (!enabled) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const pageStr = params.get(pageSearchParam) ?? ''
    const parsedPage = parseInt(pageStr, 10)
    const pageIndex = parsedPage - 1

    if (isNaN(pageIndex)) {
      return
    }

    navigateToPageIndex(pageIndex, {
      maxIndex,
      scrollRowIndex: getInitialScrollRowIndex(pageIndex),
    })
  }, [enabled, maxIndex, navigateToPageIndex, pageSearchParam])

  // NOTE: pageIndex 값이 바뀌면 URL search param에 마지막 위치를 반영해요.
  useEffect(() => {
    if (!enabled) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      replacePageSearchParam(pageSearchParam, pageIndex)
    }, PAGE_SEARCH_PARAM_COMMIT_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [enabled, pageIndex, pageSearchParam])
}

function replacePageSearchParam(searchParam: string, pageIndex: number) {
  const url = new URL(window.location.href)
  const nextPage = String(pageIndex + 1)

  if (url.searchParams.get(searchParam) === nextPage) {
    return
  }

  url.searchParams.set(searchParam, nextPage)
  window.history.replaceState(window.history.state, '', url)
}
