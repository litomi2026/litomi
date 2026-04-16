import { create } from 'zustand'

type ImportMangaModalStore = {
  libraryId: number | null
  setLibraryId: (libraryId: number | null) => void
}

export const useImportMangaModalStore = create<ImportMangaModalStore>()((set) => ({
  libraryId: null,
  setLibraryId: (libraryId: number | null) => set({ libraryId }),
}))
