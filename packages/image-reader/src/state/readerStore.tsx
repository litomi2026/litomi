'use client'

import type { ReactNode, RefObject } from 'react'
import type { ListImperativeAPI } from 'react-window'
import type { StoreApi } from 'zustand/vanilla'

import { createContext, useContext, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

export type ImageWidth = 100 | 30 | 50 | 70
export type LowDataMode = 'auto' | 'off' | 'on'

export type NavigateToPageIndexOptions = {
  maxIndex?: number
  scroll?: boolean
  scrollRowIndex?: number
}

export type Orientation = 'horizontal-reverse' | 'horizontal' | 'vertical-reverse' | 'vertical'
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
  doublePageAnchorIndex: number
  getOrientation: () => Orientation
  getPageIndex: () => number
  imageWidth: ImageWidth
  isStorageHydrated: boolean
  navigateToPageIndex: (index: number, options?: NavigateToPageIndexOptions) => void
  orientation: Orientation
  pageIndex: number
  pageView: PageView
  readingDirection: ReadingDirection
  resetPageIndex: () => void
  screenFit: ScreenFit
  setImageWidth: (imageWidth: ImageWidth) => void
  setListRef: (listRef: RefObject<ListImperativeAPI | null> | null) => void
  setOrientation: (orientation: Orientation) => void
  setPageView: (pageView: PageView) => void
  setScreenFit: (screenFit: ScreenFit) => void
  setStorageHydrated: () => void
  setViewerMode: (mode: ViewerMode) => void
  toggleReadingDirection: () => void
  viewerMode: ViewerMode
}

export type ReadingDirection = 'ltr' | 'rtl'
export type ScreenFit = 'all' | 'height' | 'width'
export type ViewerMode = 'page' | 'scroll'

type PersistedStoreApi<T> = StoreApi<T> & {
  persist: {
    rehydrate: () => Promise<void> | void
  }
}

type ReaderPersistedState = Pick<
  ReaderStore,
  'imageWidth' | 'orientation' | 'pageView' | 'readingDirection' | 'screenFit' | 'viewerMode'
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
const DEFAULT_SCREEN_FIT: ScreenFit = 'all'
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
  let listRef: RefObject<ListImperativeAPI | null> | null = null

  function scrollToRow(index: number) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        listRef?.current?.scrollToRow({
          align: 'center',
          behavior: 'instant',
          index,
        })
      })
    })
  }

  return createStore<ReaderStore>()(
    persist(
      (set, get) => ({
        doublePageAnchorIndex: 0,
        getOrientation: () => get().orientation,
        getPageIndex: () => get().pageIndex,
        imageWidth: DEFAULT_IMAGE_WIDTH,
        isStorageHydrated: false,
        navigateToPageIndex: (pageIndex, options = {}) => {
          const nextPageIndex = clampPageIndex(pageIndex, options.maxIndex)

          set({ pageIndex: nextPageIndex })

          if (options.scroll !== false) {
            scrollToRow(options.scrollRowIndex ?? nextPageIndex)
          }
        },
        orientation: DEFAULT_ORIENTATION,
        pageIndex: 0,
        pageView: DEFAULT_PAGE_VIEW,
        readingDirection: DEFAULT_READING_DIRECTION,
        resetPageIndex: () => {
          set({
            doublePageAnchorIndex: 0,
            pageIndex: 0,
          })
        },
        screenFit: DEFAULT_SCREEN_FIT,
        setImageWidth: (imageWidth) => {
          set({ imageWidth })
        },
        setListRef: (nextListRef) => {
          listRef = nextListRef
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
          imageWidth: state.imageWidth,
          orientation: state.orientation,
          pageView: state.pageView,
          readingDirection: state.readingDirection,
          screenFit: state.screenFit,
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
