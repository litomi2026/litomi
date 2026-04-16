'use client'

import { create } from 'zustand'

type BookmarkImportModalStore = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const useBookmarkImportModalStore = create<BookmarkImportModalStore>()((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}))
