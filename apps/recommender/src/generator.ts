import { type CatalogMangaScoringRecord, selectCatalogMangaScoringRecordsByIds } from '@litomi/db/catalog/query'
import { CensorshipLevel } from '@litomi/domain/censorship/model'
import { MANGA_RECOMMENDATION_ITEM_LIMIT } from '@litomi/domain/manga-recommendation/policy'
import {
  type CensorshipMatcher,
  type CensorshipRule,
  createCensorshipMatcher,
  isMangaHiddenByCensorship,
} from './censorship'
import {
  buildUserFeaturePosterior,
  getFeaturePosteriorCatalogHints,
  hasUsableFeaturePosterior,
  scoreCatalogMangaRecordByFeaturePosterior,
  type UserFeaturePosterior,
} from './feature-posterior'
import { log } from './log'
import { searchMangaIdsByFeaturePosterior } from './opensearch'
import {
  mergeCandidateRows,
  replaceMangaRecommendationSet,
  selectCollaborativeCandidates,
  selectUserCensorshipRules,
  selectUserInteractedMangaIds,
  selectUserPreferenceSignals,
} from './query'
import { scoreCandidates } from './scoring'
import type { Candidate, CandidateRow, GenerateOptions, MangaRecommendation, PreferenceSignal } from './types'

const CANDIDATE_LIMIT = 600
const POSTERIOR_CANDIDATE_LIMIT = 900

export async function generateMangaRecommendationsForUser(
  userId: number,
  options: GenerateOptions = {},
): Promise<MangaRecommendation[]> {
  const itemLimit = options.itemLimit ?? MANGA_RECOMMENDATION_ITEM_LIMIT
  const signals = await selectUserPreferenceSignals(userId)
  const censorshipRules = await selectUserCensorshipRules(userId, CensorshipLevel.HEAVY)
  const hiddenCensorshipMatcher = createCensorshipMatcher(censorshipRules)
  const { signalRecordMap, visibleSignals } = await selectVisibleSignalsWithRecords(signals, hiddenCensorshipMatcher)
  const visiblePositiveSignals = visibleSignals.filter((signal) => signal.sentiment === 'positive')
  const featurePosterior = buildUserFeaturePosterior(visibleSignals, signalRecordMap)
  const candidates = new Map<number, Candidate>()
  const candidateRecordCache = new Map<number, CatalogMangaScoringRecord>()

  if (visiblePositiveSignals.length > 0) {
    mergeCandidateRows(candidates, await selectCollaborativeCandidates(userId, visiblePositiveSignals, CANDIDATE_LIMIT))
  }

  if (hasUsableFeaturePosterior(featurePosterior)) {
    const posterior = await selectFeaturePosteriorCandidates(
      userId,
      featurePosterior,
      hiddenCensorshipMatcher,
      censorshipRules,
    )

    mergeCandidateRows(candidates, posterior.rows)

    for (const record of posterior.records) {
      candidateRecordCache.set(record.id, record)
    }
  }

  const items = await scoreCandidates(
    Array.from(candidates.values()),
    itemLimit,
    hiddenCensorshipMatcher,
    featurePosterior,
    candidateRecordCache,
  )

  await replaceMangaRecommendationSet(userId, items)

  return items
}

async function selectFeaturePosteriorCandidates(
  userId: number,
  featurePosterior: UserFeaturePosterior,
  hiddenCensorshipMatcher: CensorshipMatcher,
  censorshipRules: readonly CensorshipRule[],
): Promise<{ records: CatalogMangaScoringRecord[]; rows: CandidateRow[] }> {
  const excludedMangaIds = new Set(await selectUserInteractedMangaIds(userId))

  let mangaIds: number[]

  try {
    mangaIds = await searchMangaIdsByFeaturePosterior({
      censorshipRules,
      excludedMangaIds: Array.from(excludedMangaIds),
      hints: getFeaturePosteriorCatalogHints(featurePosterior),
      limit: POSTERIOR_CANDIDATE_LIMIT,
    })
  } catch (error) {
    // OpenSearch is a soft dependency: degrade to collaborative-only candidates when the search fails.
    log.warn('degraded: skipping feature-posterior candidates after OpenSearch failure', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    })
    return { records: [], rows: [] }
  }

  const records = await selectCatalogMangaScoringRecordsByIds(mangaIds)

  const rows = records.flatMap<CandidateRow>((record) => {
    if (excludedMangaIds.has(record.id) || isMangaHiddenByCensorship(record, hiddenCensorshipMatcher)) {
      return []
    }

    const match = scoreCatalogMangaRecordByFeaturePosterior(record, featurePosterior)

    if (match.score <= 0) {
      return []
    }

    return [
      {
        mangaId: record.id,
        reasonMask: match.reasonMask,
        score: 0,
      },
    ]
  })

  return { records, rows }
}

async function selectVisibleSignalsWithRecords(
  signals: PreferenceSignal[],
  hiddenCensorshipMatcher: CensorshipMatcher,
): Promise<{ signalRecordMap: Map<number, CatalogMangaScoringRecord>; visibleSignals: PreferenceSignal[] }> {
  if (signals.length === 0) {
    return {
      signalRecordMap: new Map(),
      visibleSignals: signals,
    }
  }

  const records = await selectCatalogMangaScoringRecordsByIds(signals.map((signal) => signal.mangaId))
  const recordMap = new Map(records.map((record) => [record.id, record]))

  if (hiddenCensorshipMatcher.size === 0) {
    return {
      signalRecordMap: recordMap,
      visibleSignals: signals,
    }
  }

  return {
    signalRecordMap: recordMap,
    visibleSignals: signals.filter((signal) => {
      const record = recordMap.get(signal.mangaId)
      return !record || !isMangaHiddenByCensorship(record, hiddenCensorshipMatcher)
    }),
  }
}
