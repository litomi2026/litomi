import { create } from 'zustand'

interface LibrarySelectionState {
  enterSelectionMode: () => void
  exitSelectionMode: () => void
  isSelectionMode: boolean
  selectedItems: Set<number>
  toggleSelection: (mangaId: number) => void
}

export const useLibrarySelectionStore = create<LibrarySelectionState>((set) => ({
  selectedItems: new Set(),
  isSelectionMode: false,

  toggleSelection: (mangaId) =>
    set((state) => {
      const newSelected = new Set(state.selectedItems)
      if (newSelected.has(mangaId)) {
        newSelected.delete(mangaId)
      } else {
        newSelected.add(mangaId)
      }
      return { selectedItems: newSelected }
    }),

  enterSelectionMode: () =>
    set(() => ({
      isSelectionMode: true,
    })),

  exitSelectionMode: () =>
    set(() => ({
      isSelectionMode: false,
      selectedItems: new Set(),
    })),
}))
