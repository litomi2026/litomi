import { create } from 'zustand'

export type AuthStore = {
  accessToken: string | null
  setAccessToken: (accessToken: string | null) => void
}

export const useAuthStore = create<AuthStore>()((set) => ({
  accessToken: null,
  setAccessToken: (accessToken) => set(() => ({ accessToken })),
}))
