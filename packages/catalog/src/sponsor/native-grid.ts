import 'server-only'
import type { NativeGridSponsor, NativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'

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

const TARGETABLE_TAG_CATEGORIES = new Set(['female', 'male', 'mixed', 'other', 'tag'])
const NATIVE_GRID_SPONSORS: NativeGridSponsorConfig[] = nativeGridSponsorsJSON

export function getNativeGridSponsor(
  placementId: NativeGridSponsorPlacement,
  searchQuery?: string | null,
): NativeGridSponsor | null {
  const now = new Date()
  const searchTargetingKeywords = parseSearchTargetingKeywords(searchQuery)

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

    return keywords.some(
      (keyword) => searchTargetingKeywords.included.has(keyword) && !searchTargetingKeywords.excluded.has(keyword),
    )
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

function parseSearchTargetingKeywords(searchQuery?: string | null) {
  const excluded = new Set<string>()
  const included = new Set<string>()

  if (!searchQuery?.trim()) {
    return { excluded, included }
  }

  const tokens = searchQuery.trim().split(/\s+/)

  for (const rawToken of tokens) {
    const isExcluded = rawToken.startsWith('-')
    const token = isExcluded ? rawToken.replace(/^-+/, '') : rawToken
    const colonIndex = token.indexOf(':')
    const keyword = colonIndex < 0 ? token : token.slice(colonIndex + 1)

    if (!keyword) {
      continue
    }

    if (colonIndex > 0) {
      const category = token.slice(0, colonIndex)

      if (!TARGETABLE_TAG_CATEGORIES.has(category)) {
        continue
      }
    }

    const keywords = isExcluded ? excluded : included
    keywords.add(keyword)
  }

  return { excluded, included }
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
