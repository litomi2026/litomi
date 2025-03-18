import { Virtualizer } from '@tanstack/react-virtual'
import { create } from 'zustand'

type Store = {
  virtualizer: Virtualizer<HTMLDivElement, Element> | null
  getVirtualizer: () => Virtualizer<HTMLDivElement, Element> | null
  setVirtualizer: (virtualizer: Virtualizer<HTMLDivElement, Element> | null) => void
}

export const useVirtualizerStore = create<Store>()((set, get) => ({
  virtualizer: null,
  getVirtualizer: () => get().virtualizer,
  setVirtualizer: (virtualizer) => set({ virtualizer }),
}))
