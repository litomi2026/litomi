import { RefObject } from 'react'
import { ListImperativeAPI } from 'react-window'
import { create } from 'zustand'

type Store = {
  listRef: RefObject<ListImperativeAPI | null> | null
  getListRef: () => RefObject<ListImperativeAPI | null> | null
  setListRef: (listRef: RefObject<ListImperativeAPI | null> | null) => void
  scrollToRow: (index: number) => void
}

export const useVirtualScrollStore = create<Store>()((set, get) => ({
  listRef: null,
  getListRef: () => get().listRef,
  setListRef: (listRef) => set({ listRef }),
  scrollToRow: (index: number) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        get().listRef?.current?.scrollToRow({
          index,
          align: 'center',
          behavior: 'instant',
        })
      })
    })
  },
}))
