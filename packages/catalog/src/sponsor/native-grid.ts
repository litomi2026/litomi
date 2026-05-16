import 'server-only'
import type { NativeGridSponsor, NativeGridSponsorPlacement } from '@litomi/contracts'

import { getRandomDecimal } from '@litomi/std'

import nativeGridSponsorsJSON from './native-grid.json'

type NativeGridSponsorConfig = Omit<NativeGridSponsor, 'placementId'> & {
  enabled: boolean
  endsAt?: string
  id: string
  placements: readonly string[]
  startsAt?: string
  targeting?: { keywords?: readonly string[] }
  weight: number
}

const NATIVE_GRID_SPONSORS: NativeGridSponsorConfig[] = Object.entries(nativeGridSponsorsJSON).map(([id, sponsor]) => ({
  ...sponsor,
  id,
}))

export function getNativeGridSponsor(
  placementId: NativeGridSponsorPlacement,
  searchQuery?: string | null,
): NativeGridSponsor | null {
  const now = new Date()
  const normalizedSearchQuery = searchQuery?.toLowerCase()

  const activeSponsors = NATIVE_GRID_SPONSORS.filter((sponsor) => {
    if (!sponsor.enabled || !sponsor.placements.includes(placementId)) {
      return false
    }

    if (sponsor.startsAt && new Date(sponsor.startsAt) > now) {
      return false
    }

    if (sponsor.endsAt && new Date(sponsor.endsAt) <= now) {
      return false
    }

    const keywords = sponsor.targeting?.keywords

    if (!keywords) {
      return true
    }

    if (!normalizedSearchQuery) {
      return false
    }

    return keywords.some((keyword) => normalizedSearchQuery.includes(keyword.toLowerCase()))
  })

  const sponsor = pickWeightedSponsor(activeSponsors)

  if (!sponsor) {
    return null
  }

  return {
    advertiserName: sponsor.advertiserName,
    campaignId: sponsor.campaignId,
    creativeId: sponsor.creativeId,
    description: sponsor.description,
    id: sponsor.id,
    imageUrls: sponsor.imageUrls,
    label: sponsor.label,
    placementId,
    position: sponsor.position,
    targetUrl: sponsor.targetUrl,
    title: sponsor.title,
  }
}

function pickWeightedSponsor(sponsors: NativeGridSponsorConfig[]) {
  if (sponsors.length === 0) {
    return null
  }

  const totalWeight = sponsors.reduce((sum, sponsor) => sum + sponsor.weight, 0)
  let cursor = getRandomDecimal() * totalWeight

  for (const sponsor of sponsors) {
    cursor -= sponsor.weight

    if (cursor <= 0) {
      return sponsor
    }
  }

  return sponsors[sponsors.length - 1]
}
