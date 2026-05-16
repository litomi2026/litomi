export const NativeGridSponsorPlacement = {
  LIBRARY_HOME: 'public_grid_library_home',
  NEW: 'public_grid_new',
  RANDOM: 'public_grid_random',
  RANKING: 'public_grid_ranking',
  SEARCH: 'public_grid_search',
} as const

export type NativeGridSponsor = {
  advertiserName?: string
  campaignId: string
  creativeId: string
  description: string
  id: string
  imageUrls: readonly string[]
  label: string
  placementId: NativeGridSponsorPlacement
  position: number
  targetUrl: string
  title: string
}

export type NativeGridSponsorPlacement = (typeof NativeGridSponsorPlacement)[keyof typeof NativeGridSponsorPlacement]
