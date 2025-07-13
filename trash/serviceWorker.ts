import { create } from 'zustand'

type Store = {
  isServiceWorkerRegistered: boolean
  setIsServiceWorkerRegistered: (isServiceWorkerRegistered: boolean) => void
}

export const useServiceWorkerStore = create<Store>()((set) => ({
  isServiceWorkerRegistered: false,
  setIsServiceWorkerRegistered: (isServiceWorkerRegistered) => set({ isServiceWorkerRegistered }),
}))
