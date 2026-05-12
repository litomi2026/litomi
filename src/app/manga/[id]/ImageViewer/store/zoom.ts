import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { SessionStorageKey } from '@/constants/storage'

type Store = {
  zoomLevel: number
  getZoomLevel: () => number
  setZoomLevel: (zoom: number) => void
  resetZoom: () => void
}

export const DEFAULT_ZOOM = 1
export const MAX_ZOOM = 10

export function clampZoomLevel(zoom: number) {
  return Math.min(Math.max(DEFAULT_ZOOM, zoom), MAX_ZOOM)
}

export const useZoomStore = create<Store>()(
  persist(
    (set, get) => ({
      zoomLevel: DEFAULT_ZOOM,
      getZoomLevel: () => get().zoomLevel,
      setZoomLevel: (zoom: number) => set({ zoomLevel: zoom }),
      resetZoom: () => set({ zoomLevel: DEFAULT_ZOOM }),
    }),
    {
      name: SessionStorageKey.CONTROLLER_ZOOM,
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
