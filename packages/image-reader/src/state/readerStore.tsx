'use client'

import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand/vanilla'

import { createContext, useContext, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

export type ImageFit = 'contain' | 'fit-height' | 'fit-width'
export type ImageWidth = 100 | 30 | 50 | 70
export type LowDataMode = 'auto' | 'off' | 'on'

export type NavigateToPageIndexOptions = {
  maxIndex?: number
  navigationType: PageNavigationType
  scroll?: boolean
}

export type Orientation = 'horizontal-reverse' | 'horizontal' | 'vertical-reverse' | 'vertical'
export type PageNavigationType = 'absolute' | 'relative'
export type PageView = 'double' | 'single'

export type ReaderSessionStore = {
  brightness: number
  cycleLowData: () => void
  getBrightness: () => number
  getZoomLevel: () => number
  lowData: LowDataMode
  resetZoom: () => void
  setBrightness: (brightness: number) => void
  setZoomLevel: (zoom: number) => void
  zoomLevel: number
}

export type ReaderStore = {
  clearScrollTargetPageIndex: () => void
  doublePageAnchorIndex: number
  getOrientation: () => Orientation
  getPageIndex: () => number
  imageWidth: ImageWidth
  isStorageHydrated: boolean
  navigateToPageIndex: (index: number, options: NavigateToPageIndexOptions) => void
  orientation: Orientation
  pageIndex: number
  pageView: PageView
  readingDirection: ReadingDirection
  resetPageIndex: () => void
  scrollAxis: ScrollAxis
  imageFit: ImageFit
  scrollTargetPageIndex: number | null
  setImageWidth: (imageWidth: ImageWidth) => void
  setOrientation: (orientation: Orientation) => void
  setPageView: (pageView: PageView) => void
  setScrollAxis: (scrollAxis: ScrollAxis) => void
  setImageFit: (imageFit: ImageFit) => void
  setStorageHydrated: () => void
  setViewerMode: (mode: ViewerMode) => void
  toggleReadingDirection: () => void
  viewerMode: ViewerMode
}
export type ReadingDirection = 'ltr' | 'rtl'
export type ScrollAxis = 'horizontal' | 'vertical'
export type ViewerMode = 'page' | 'scroll'

type PersistedStoreApi<T> = StoreApi<T> & {
  persist: {
    rehydrate: () => Promise<void> | void
  }
}

type ReaderPersistedState = Pick<
  ReaderStore,
  'imageFit' | 'imageWidth' | 'orientation' | 'pageView' | 'readingDirection' | 'scrollAxis' | 'viewerMode'
>

type ReaderProviderProps = {
  children: ReactNode
  persistenceKey?: string
}

type ReaderSessionPersistedState = Pick<ReaderSessionStore, 'brightness' | 'lowData' | 'zoomLevel'>
type ReaderSessionStoreApi = PersistedStoreApi<ReaderSessionStore>

type ReaderSessionStoreOptions = {
  sessionStorageKey: string
}

type ReaderStoreApi = PersistedStoreApi<ReaderStore>

type ReaderStoreOptions = {
  localStorageKey: string
}

type ReaderStores = {
  readerSessionStore: ReaderSessionStoreApi
  readerStore: ReaderStoreApi
}

export const DEFAULT_ZOOM = 1
export const MAX_ZOOM = 10
export const orientations: Orientation[] = ['horizontal', 'vertical', 'horizontal-reverse', 'vertical-reverse']

const DEFAULT_BRIGHTNESS = 100
const DEFAULT_IMAGE_WIDTH: ImageWidth = 100
const DEFAULT_LOW_DATA: LowDataMode = 'auto'
const DEFAULT_ORIENTATION: Orientation = 'horizontal'
const DEFAULT_PAGE_VIEW: PageView = 'single'
const DEFAULT_PERSISTENCE_KEY = 'reader'
const DEFAULT_READING_DIRECTION: ReadingDirection = 'ltr'
const DEFAULT_SCROLL_AXIS: ScrollAxis = 'vertical'
const DEFAULT_IMAGE_FIT: ImageFit = 'contain'
const DEFAULT_VIEWER_MODE: ViewerMode = 'page'
const LOW_DATA_MODES: readonly LowDataMode[] = ['off', 'auto', 'on']

const ReaderStoreContext = createContext<ReaderStores | null>(null)

export function clampZoomLevel(zoom: number) {
  return Math.min(Math.max(DEFAULT_ZOOM, zoom), MAX_ZOOM)
}

export function ReaderProvider({ children, persistenceKey = DEFAULT_PERSISTENCE_KEY }: ReaderProviderProps) {
  const [stores] = useState(() => {
    return {
      readerSessionStore: createReaderSessionStore({
        sessionStorageKey: `${persistenceKey}/session-settings`,
      }),
      readerStore: createReaderStore({
        localStorageKey: `${persistenceKey}/local-settings`,
      }),
    }
  })

  useEffect(() => {
    let isMounted = true

    async function hydrateStores() {
      try {
        await Promise.all([stores.readerStore.persist.rehydrate(), stores.readerSessionStore.persist.rehydrate()])
      } finally {
        if (isMounted) {
          stores.readerStore.getState().setStorageHydrated()
        }
      }
    }

    hydrateStores()

    return () => {
      isMounted = false
    }
  }, [stores])

  return <ReaderStoreContext.Provider value={stores}>{children}</ReaderStoreContext.Provider>
}

export function useReaderSessionStore<T>(selector: (store: ReaderSessionStore) => T): T {
  return useStore(useReaderStores().readerSessionStore, selector)
}

export function useReaderStore<T>(selector: (store: ReaderStore) => T): T {
  return useStore(useReaderStores().readerStore, selector)
}

function clampBrightness(brightness: number) {
  return Math.min(Math.max(10, Math.ceil(brightness)), 100)
}

function clampPageIndex(pageIndex: number, maxIndex?: number) {
  const nextPageIndex = Number.isFinite(pageIndex) ? Math.floor(pageIndex) : 0
  const minClampedPageIndex = Math.max(0, nextPageIndex)

  if (typeof maxIndex !== 'number') {
    return minClampedPageIndex
  }

  return Math.min(minClampedPageIndex, Math.max(0, maxIndex))
}

function createReaderSessionStore({ sessionStorageKey }: ReaderSessionStoreOptions) {
  return createStore<ReaderSessionStore>()(
    persist(
      (set, get) => ({
        brightness: DEFAULT_BRIGHTNESS,
        cycleLowData: () => {
          const currentIndex = LOW_DATA_MODES.indexOf(get().lowData)
          const nextLowData = LOW_DATA_MODES[(currentIndex + 1) % LOW_DATA_MODES.length] ?? DEFAULT_LOW_DATA

          set({ lowData: nextLowData })
        },
        getBrightness: () => get().brightness,
        getZoomLevel: () => get().zoomLevel,
        lowData: DEFAULT_LOW_DATA,
        resetZoom: () => {
          set({ zoomLevel: DEFAULT_ZOOM })
        },
        setBrightness: (brightness) => {
          set({ brightness: clampBrightness(brightness) })
        },
        setZoomLevel: (zoom) => {
          set({ zoomLevel: clampZoomLevel(zoom) })
        },
        zoomLevel: DEFAULT_ZOOM,
      }),
      {
        name: sessionStorageKey,
        partialize: (state): ReaderSessionPersistedState => ({
          brightness: state.brightness,
          lowData: state.lowData,
          zoomLevel: state.zoomLevel,
        }),
        skipHydration: true,
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  )
}

function createReaderStore({ localStorageKey }: ReaderStoreOptions) {
  return createStore<ReaderStore>()(
    persist(
      (set, get) => ({
        clearScrollTargetPageIndex: () => {
          set({ scrollTargetPageIndex: null })
        },
        doublePageAnchorIndex: 0,
        getOrientation: () => get().orientation,
        getPageIndex: () => get().pageIndex,
        imageFit: DEFAULT_IMAGE_FIT,
        imageWidth: DEFAULT_IMAGE_WIDTH,
        isStorageHydrated: false,
        navigateToPageIndex: (pageIndex, options) => {
          const { maxIndex, navigationType, scroll = true } = options
          const nextPageIndex = clampPageIndex(pageIndex, maxIndex)

          set({
            pageIndex: nextPageIndex,
            ...(scroll && { scrollTargetPageIndex: nextPageIndex }),
            ...(navigationType === 'absolute' && { doublePageAnchorIndex: nextPageIndex }),
          })
        },
        orientation: DEFAULT_ORIENTATION,
        pageIndex: 0,
        pageView: DEFAULT_PAGE_VIEW,
        readingDirection: DEFAULT_READING_DIRECTION,
        resetPageIndex: () => {
          set({
            doublePageAnchorIndex: 0,
            pageIndex: 0,
            scrollTargetPageIndex: null,
          })
        },
        scrollAxis: DEFAULT_SCROLL_AXIS,
        scrollTargetPageIndex: null,
        setImageWidth: (imageWidth) => {
          set({ imageWidth })
        },
        setOrientation: (orientation) => {
          set({ orientation })
        },
        setPageView: (pageView) => {
          set((state) => ({
            doublePageAnchorIndex: pageView === 'double' ? state.pageIndex : state.doublePageAnchorIndex,
            pageView,
          }))
        },
        setScreenFit: (screenFit) => {
          set({ screenFit })
        },
        setStorageHydrated: () => {
          set({ isStorageHydrated: true })
        },
        setViewerMode: (viewerMode) => {
          set({ viewerMode })
        },
        toggleReadingDirection: () => {
          set({ readingDirection: get().readingDirection === 'ltr' ? 'rtl' : 'ltr' })
        },
        viewerMode: DEFAULT_VIEWER_MODE,
      }),
      {
        name: localStorageKey,
        partialize: (state): ReaderPersistedState => ({
          imageFit: state.imageFit,
          imageWidth: state.imageWidth,
          orientation: state.orientation,
          pageView: state.pageView,
          readingDirection: state.readingDirection,
          scrollAxis: state.scrollAxis,
          viewerMode: state.viewerMode,
        }),
        skipHydration: true,
        storage: createJSONStorage(() => localStorage),
      },
    ),
  )
}

function useReaderStores() {
  const stores = useContext(ReaderStoreContext)

  if (!stores) {
    throw new Error('ReaderProvider is required to use reader state.')
  }

  return stores
}
