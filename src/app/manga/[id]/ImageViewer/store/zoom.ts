import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { SessionStorageKey } from '@/constants/storage'

type Store = {
  zoomLevel: number
  getZoomLevel: () => number
  setZoomLevel: (zoom: number) => void
  resetZoom: () => void
}

const DEFAULT_ZOOM = 1
const MAX_ZOOM = 10

export const useZoomStore = create<Store>()(
  persist(
    (set, get) => ({
      zoomLevel: DEFAULT_ZOOM,
      getZoomLevel: () => get().zoomLevel,
      setZoomLevel: (zoom: number) => {
        const clampedZoom = Math.min(Math.max(DEFAULT_ZOOM, zoom), MAX_ZOOM)
        set({ zoomLevel: clampedZoom })
      },
      resetZoom: () => set({ zoomLevel: DEFAULT_ZOOM }),
    }),
    {
      name: SessionStorageKey.CONTROLLER_ZOOM,
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

export { DEFAULT_ZOOM, MAX_ZOOM }
