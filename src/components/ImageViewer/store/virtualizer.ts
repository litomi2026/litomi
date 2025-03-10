import { Virtualizer } from '@tanstack/react-virtual'
import { create } from 'zustand'

type Store = {
  virtualizer: Virtualizer<HTMLDivElement, Element> | null
  setVirtualizer: (virtualizer: Virtualizer<HTMLDivElement, Element> | null) => void
}

export const useVirtualizerStore = create<Store>()((set) => ({
  virtualizer: null,
  setVirtualizer: (virtualizer) => set({ virtualizer }),
}))
