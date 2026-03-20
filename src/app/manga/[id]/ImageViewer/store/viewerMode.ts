import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKey } from '@/constants/storage'

export type ViewerMode = 'page' | 'scroll'

type Store = {
  viewerMode: ViewerMode
  setViewerMode: (mode: ViewerMode) => void
}

export const useViewerModeStore = create<Store>()(
  persist(
    (set) => ({
      viewerMode: 'page',
      setViewerMode: (viewerMode: ViewerMode) => set({ viewerMode }),
    }),
    { name: LocalStorageKey.CONTROLLER_VIEWER_MODE },
  ),
)
