import { create } from 'zustand'

type Store = {
  zoomLevel: number
  zoomOrigin: { x: string; y: string }
  getZoomLevel: () => number
  setZoomLevel: (zoom: number) => void
  setZoomOrigin: (origin: { x: string; y: string }) => void
  resetZoom: () => void
}

const DEFAULT_ZOOM = 1
const MAX_ZOOM = 10

export const useZoomStore = create<Store>()((set, get) => ({
  zoomLevel: DEFAULT_ZOOM,
  zoomOrigin: { x: '50%', y: '50%' },
  getZoomLevel: () => get().zoomLevel,
  setZoomLevel: (zoom: number) => {
    const clampedZoom = Math.min(Math.max(DEFAULT_ZOOM, zoom), MAX_ZOOM)
    set({ zoomLevel: clampedZoom })
  },
  setZoomOrigin: (origin) => set({ zoomOrigin: origin }),
  resetZoom: () =>
    set({
      zoomLevel: DEFAULT_ZOOM,
      zoomOrigin: { x: '50%', y: '50%' },
    }),
}))

export { DEFAULT_ZOOM, MAX_ZOOM }
