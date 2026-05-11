import { create } from 'zustand'

import { MangaIdSearchParam } from '@/app/manga/[id]/common'

import { usePageViewStore } from './pageView'
import { useVirtualScrollStore } from './virtualizer'

export type NavigateToPageIndexOptions = {
  maxIndex?: number
  scroll?: boolean
}

type Store = {
  getPageIndex: () => number
  navigateToPageIndex: (index: number, options?: NavigateToPageIndexOptions) => void
  pageIndex: number
  resetPageIndex: () => void
}

let navigationTimer: ReturnType<typeof setTimeout> | null = null
let lastPageIndex: number | null = null

function clampPageIndex(pageIndex: number, maxIndex?: number) {
  const nextPageIndex = Number.isFinite(pageIndex) ? Math.floor(pageIndex) : 0
  const minClampedPageIndex = Math.max(0, nextPageIndex)

  if (typeof maxIndex !== 'number') {
    return minClampedPageIndex
  }

  return Math.min(minClampedPageIndex, Math.max(0, maxIndex))
}

function clearNavigationTimer() {
  if (!navigationTimer) {
    return
  }

  clearTimeout(navigationTimer)
  navigationTimer = null
}

function getRowIndex(pageIndex: number) {
  const { pageView } = usePageViewStore.getState()
  return pageView === 'double' ? Math.floor(pageIndex / 2) : pageIndex
}

function schedulePageSearchParamUpdate(pageIndex: number) {
  lastPageIndex = pageIndex
  clearNavigationTimer()

  navigationTimer = setTimeout(() => {
    try {
      if (typeof lastPageIndex === 'number') {
        updatePageSearchParamFromPageIndex(lastPageIndex)
      }
    } catch (error) {
      console.warn('navigateToPageIndex:', error)
    }
  }, 200)
}

function updatePageSearchParamFromPageIndex(pageIndex: number) {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  url.searchParams.set(MangaIdSearchParam.PAGE, String(pageIndex + 1))
  window.history.replaceState(window.history.state, '', url)
}

export const usePageNavigationStore = create<Store>()((set, get) => ({
  getPageIndex: () => get().pageIndex,
  navigateToPageIndex: (pageIndex, options = {}) => {
    const nextPageIndex = clampPageIndex(pageIndex, options.maxIndex)
    set({ pageIndex: nextPageIndex })
    schedulePageSearchParamUpdate(nextPageIndex)

    if (options.scroll !== false) {
      useVirtualScrollStore.getState().scrollToRow(getRowIndex(nextPageIndex))
    }
  },
  pageIndex: 0,
  resetPageIndex: () => {
    clearNavigationTimer()
    lastPageIndex = null
    set({ pageIndex: 0 })
  },
}))
