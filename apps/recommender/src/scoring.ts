import { type CatalogMangaScoringRecord, selectCatalogMangaScoringRecordsByIds } from '@litomi/db/catalog/query'
import { addMangaRecommendationReason } from '@litomi/domain/manga-recommendation/reason'
import { type CensorshipMatcher, isMangaHiddenByCensorship } from './censorship'
import { scoreCatalogMangaRecordByFeaturePosterior, type UserFeaturePosterior } from './feature-posterior'
import type { Candidate, MangaRecommendation } from './types'

const FEATURE_POSTERIOR_SCORE_WEIGHT = 12
const SOURCE_SCORE_CAP = 220
const SOURCE_SCORE_WEIGHT = 28
const FRESH_AGE_DAYS = 45
const FRESHNESS_DECAY_DAYS = 90
const FRESHNESS_MAX_SCORE = 24
const FRESH_BUCKET_LIMIT_RATIO = 0.35
const RECENT_AGE_DAYS = 180
const RECENT_BUCKET_LIMIT_RATIO = 0.65

type AgeBucket = 'evergreen' | 'fresh' | 'recent' | 'unknown'

type ScoreCandidateContext = {
  featurePosterior: UserFeaturePosterior
  now: number
  hiddenCensorshipMatcher: CensorshipMatcher
}

type DiversityState = {
  featureCounts: Map<string, number>
  freshCount: number
  recentOrFreshCount: number
}

type ScoredRecommendation = MangaRecommendation & {
  ageBucket: AgeBucket
  diversityKeys: string[]
  rankScore: number
}

export async function scoreCandidates(
  candidates: Candidate[],
  limit: number,
  hiddenCensorshipMatcher: CensorshipMatcher,
  featurePosterior: UserFeaturePosterior,
  recordCache: ReadonlyMap<number, CatalogMangaScoringRecord> = new Map(),
): Promise<MangaRecommendation[]> {
  if (candidates.length === 0) {
    return []
  }

  const candidateIds = candidates.map((candidate) => candidate.mangaId)
  const missingIds = candidateIds.filter((id) => !recordCache.has(id))
  const fetchedRecords = missingIds.length > 0 ? await selectCatalogMangaScoringRecordsByIds(missingIds) : []
  const recordMap = new Map(recordCache)

  for (const record of fetchedRecords) {
    recordMap.set(record.id, record)
  }

  const now = Date.now()
  const context = { featurePosterior, now, hiddenCensorshipMatcher }

  const scoredCandidates = candidates
    .map((candidate) => scoreCandidate(candidate, recordMap.get(candidate.mangaId), context))
    .filter((item): item is ScoredRecommendation => item !== null)

  return diversifyRecommendations(scoredCandidates, limit).map((item, index) => toMangaRecommendation(item, index + 1))
}

function applyDiversityState(state: DiversityState, item: ScoredRecommendation) {
  for (const key of item.diversityKeys) {
    state.featureCounts.set(key, (state.featureCounts.get(key) ?? 0) + 1)
  }

  if (item.ageBucket === 'fresh') {
    state.freshCount++
  }

  if (item.ageBucket === 'fresh' || item.ageBucket === 'recent') {
    state.recentOrFreshCount++
  }
}

function diversifyRecommendations(items: ScoredRecommendation[], limit: number): ScoredRecommendation[] {
  const selected: ScoredRecommendation[] = []
  const remaining = [...items].sort((left, right) => right.rankScore - left.rankScore || left.mangaId - right.mangaId)
  const state: DiversityState = { featureCounts: new Map(), freshCount: 0, recentOrFreshCount: 0 }

  while (selected.length < limit && remaining.length > 0) {
    let bestIndex = 0
    let bestRerankScore = Number.NEGATIVE_INFINITY

    for (let index = 0; index < remaining.length; index++) {
      const item = remaining[index]!
      const rerankScore = item.rankScore - scoreDiversityPenalty(item, state, selected.length, limit)

      if (
        rerankScore > bestRerankScore ||
        (rerankScore === bestRerankScore && item.rankScore > remaining[bestIndex]!.rankScore) ||
        (rerankScore === bestRerankScore &&
          item.rankScore === remaining[bestIndex]!.rankScore &&
          item.mangaId < remaining[bestIndex]!.mangaId)
      ) {
        bestIndex = index
        bestRerankScore = rerankScore
      }
    }

    const [picked] = remaining.splice(bestIndex, 1) as [ScoredRecommendation]
    selected.push(picked)
    applyDiversityState(state, picked)
  }

  return selected
}

function getAgeBucket(createdAt: Date | null, now: number): AgeBucket {
  if (!createdAt) {
    return 'unknown'
  }

  const ageDays = Math.max(0, (now - createdAt.getTime()) / (24 * 60 * 60 * 1000))

  if (ageDays <= FRESH_AGE_DAYS) {
    return 'fresh'
  }

  if (ageDays <= RECENT_AGE_DAYS) {
    return 'recent'
  }

  return 'evergreen'
}

function getDiversityKeys(record: CatalogMangaScoringRecord) {
  return [
    ...record.series.map((value) => `series:${value}`),
    ...record.artists.map((value) => `artist:${value}`),
    ...record.characters.map((value) => `character:${value}`),
    ...record.groups.map((value) => `group:${value}`),
  ]
}

function getFeatureRepeatPenalty(key: string) {
  if (key.startsWith('series:')) {
    return 90
  }

  if (key.startsWith('artist:')) {
    return 70
  }

  if (key.startsWith('character:')) {
    return 45
  }

  return 25
}

function scoreCandidate(
  candidate: Candidate,
  record: CatalogMangaScoringRecord | undefined,
  { featurePosterior, now, hiddenCensorshipMatcher }: ScoreCandidateContext,
): ScoredRecommendation | null {
  if (!record) {
    return null
  }

  if (isMangaHiddenByCensorship(record, hiddenCensorshipMatcher)) {
    return null
  }

  const posteriorMatch = scoreCatalogMangaRecordByFeaturePosterior(record, featurePosterior)
  const freshnessScore = scoreFreshness(record.createdAt, now)
  const sourceScore = scoreSource(candidate.score)
  const rankScore = posteriorMatch.score * FEATURE_POSTERIOR_SCORE_WEIGHT + sourceScore + freshnessScore
  let reasonMask = candidate.reasonMask | posteriorMatch.reasonMask

  if (posteriorMatch.score >= 20) {
    reasonMask = addMangaRecommendationReason(reasonMask, 'matching_profile')
  }

  if (candidate.score > 0) {
    reasonMask = addMangaRecommendationReason(reasonMask, 'personalized')
  }

  if (freshnessScore >= FRESHNESS_MAX_SCORE * 0.65) {
    reasonMask = addMangaRecommendationReason(reasonMask, 'fresh')
  }

  if (reasonMask === 0) {
    reasonMask = addMangaRecommendationReason(reasonMask, 'discovery')
  }

  return {
    ageBucket: getAgeBucket(record.createdAt, now),
    diversityKeys: getDiversityKeys(record),
    generatedAt: new Date(now),
    mangaId: candidate.mangaId,
    rank: 0,
    rankScore,
    reasonMask,
    score: Math.max(1, Math.round(rankScore)),
  }
}

function scoreDiversityPenalty(
  item: ScoredRecommendation,
  state: DiversityState,
  selectedCount: number,
  limit: number,
) {
  if (selectedCount === 0) {
    return 0
  }

  let penalty = 0

  for (const key of item.diversityKeys) {
    penalty += (state.featureCounts.get(key) ?? 0) * getFeatureRepeatPenalty(key)
  }

  const freshBucketLimit = Math.ceil(limit * FRESH_BUCKET_LIMIT_RATIO)
  const recentBucketLimit = Math.ceil(limit * RECENT_BUCKET_LIMIT_RATIO)

  if (item.ageBucket === 'fresh' && state.freshCount >= freshBucketLimit) {
    penalty += 120 + (state.freshCount - freshBucketLimit) * 30
  }

  if ((item.ageBucket === 'fresh' || item.ageBucket === 'recent') && state.recentOrFreshCount >= recentBucketLimit) {
    penalty += 70 + (state.recentOrFreshCount - recentBucketLimit) * 20
  }

  return penalty
}

function scoreFreshness(createdAt: Date | null, now: number) {
  if (!createdAt) {
    return 0
  }

  const ageDays = Math.max(0, (now - createdAt.getTime()) / (24 * 60 * 60 * 1000))
  return FRESHNESS_MAX_SCORE * Math.exp(-ageDays / FRESHNESS_DECAY_DAYS)
}

function scoreSource(score: number) {
  return Math.min(SOURCE_SCORE_CAP, Math.log1p(Math.max(0, score)) * SOURCE_SCORE_WEIGHT)
}

function toMangaRecommendation(item: ScoredRecommendation, rank: number): MangaRecommendation {
  return {
    generatedAt: item.generatedAt,
    mangaId: item.mangaId,
    rank,
    reasonMask: item.reasonMask,
    score: item.score,
  }
}
