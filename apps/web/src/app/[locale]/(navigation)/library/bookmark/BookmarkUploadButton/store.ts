'use client'

import { create } from 'zustand'

type BookmarkUploadModalStore = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const useBookmarkUploadModalStore = create<BookmarkUploadModalStore>()((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}))
