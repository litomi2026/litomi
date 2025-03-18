import { LocalStorageKey } from '@/constants/storage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    { name: LocalStorageKey.CONTROLLER_PAGE_VIEW },
  ),
)
