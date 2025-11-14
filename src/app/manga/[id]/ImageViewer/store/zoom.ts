import { create } from 'zustand'

type Store = {
  zoomLevel: number
  getZoomLevel: () => number
  setZoomLevel: (zoom: number) => void
  resetZoom: () => void
}

const DEFAULT_ZOOM = 1
const MAX_ZOOM = 10

export const useZoomStore = create<Store>()((set, get) => ({
  zoomLevel: DEFAULT_ZOOM,
  getZoomLevel: () => get().zoomLevel,
  setZoomLevel: (zoom: number) => {
    const clampedZoom = Math.min(Math.max(DEFAULT_ZOOM, zoom), MAX_ZOOM)
    set({ zoomLevel: clampedZoom })
  },
  resetZoom: () => set({ zoomLevel: DEFAULT_ZOOM }),
}))

export { DEFAULT_ZOOM, MAX_ZOOM }
