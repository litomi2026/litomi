import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKeys } from '..'

export type PageView = 'double' | 'single'

type Store = {
  pageView: PageView
  setPageView: (pageView: PageView) => void
}

export const usePageViewStore = create<Store>()(
  persist(
    (set) => ({
      pageView: 'single',
      setPageView: (pageView: PageView) => set({ pageView }),
    }),
    { name: LocalStorageKeys.CONTROLLER_PAGE_VIEW },
  ),
)
