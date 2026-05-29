export const MANGA_RECOMMENDATION_REASONS = [
  'similar_readers',
  'similar_bookmarks',
  'similar_ratings',
  'similar_libraries',
  'posterior_artist',
  'posterior_character',
  'posterior_series',
  'posterior_tag',
  'feature_posterior',
  'matching_profile',
  'personalized',
  'fresh',
  'discovery',
] as const

export type MangaRecommendationReason = (typeof MANGA_RECOMMENDATION_REASONS)[number]

export const MANGA_RECOMMENDATION_REASON_BITS = {
  similar_readers: 1 << 0,
  similar_bookmarks: 1 << 1,
  similar_ratings: 1 << 2,
  similar_libraries: 1 << 3,
  posterior_artist: 1 << 4,
  posterior_character: 1 << 5,
  posterior_series: 1 << 6,
  posterior_tag: 1 << 7,
  feature_posterior: 1 << 8,
  matching_profile: 1 << 9,
  personalized: 1 << 10,
  fresh: 1 << 11,
  discovery: 1 << 12,
} as const satisfies Record<MangaRecommendationReason, number>

export function addMangaRecommendationReason(mask: number, reason: MangaRecommendationReason) {
  return mask | MANGA_RECOMMENDATION_REASON_BITS[reason]
}

export function decodeMangaRecommendationReasonMask(mask: number) {
  return MANGA_RECOMMENDATION_REASONS.filter((reason) => hasMangaRecommendationReason(mask, reason))
}

export function encodeMangaRecommendationReasonMask(reasons: Iterable<MangaRecommendationReason>) {
  let mask = 0

  for (const reason of reasons) {
    mask = addMangaRecommendationReason(mask, reason)
  }

  return mask
}

export function hasMangaRecommendationReason(mask: number, reason: MangaRecommendationReason) {
  return (mask & MANGA_RECOMMENDATION_REASON_BITS[reason]) !== 0
}
