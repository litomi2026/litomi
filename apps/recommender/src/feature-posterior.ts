import type { CatalogMangaRecord } from '@litomi/db/query/catalog-manga'

import type { PreferenceSignal } from './types'

export type FeatureKind = 'artist' | 'character' | 'series' | 'tag'

export type FeaturePosteriorCatalogHint = {
  boost: number
  value: string
}

export type FeaturePosteriorCatalogHints = {
  artists: FeaturePosteriorCatalogHint[]
  characters: FeaturePosteriorCatalogHint[]
  series: FeaturePosteriorCatalogHint[]
  tagValues: FeaturePosteriorCatalogHint[]
}

export type FeaturePosteriorMatch = {
  reasons: string[]
  score: number
}

export type UserFeaturePosterior = {
  features: UserFeaturePosteriorFeature[]
  featuresByKey: ReadonlyMap<string, UserFeaturePosteriorFeature>
}

export type UserFeaturePosteriorFeature = {
  key: string
  kind: FeatureKind
  logLift: number
  negativeEvidence: number
  negativeLogLift: number
  negativeScore: number
  posteriorMean: number
  positiveEvidence: number
  positiveScore: number
  priorMean: number
  score: number
  value: string
}

const FEATURE_POLICIES: Record<
  FeatureKind,
  {
    featureScoreCap: number
    matchScoreCap: number
    matchPenaltyCap: number
    negativeScoreWeight: number
    priorAlpha: number
    queryFeatureLimit: number
    queryMinScore: number
    scoreWeight: number
    virtualFeatureCount: number
  }
> = {
  artist: {
    featureScoreCap: 45,
    matchScoreCap: 80,
    matchPenaltyCap: 90,
    negativeScoreWeight: 3,
    priorAlpha: 0.2,
    queryFeatureLimit: 40,
    queryMinScore: 10,
    scoreWeight: 2.5,
    virtualFeatureCount: 4000,
  },
  character: {
    featureScoreCap: 34,
    matchScoreCap: 70,
    matchPenaltyCap: 80,
    negativeScoreWeight: 2.5,
    priorAlpha: 0.2,
    queryFeatureLimit: 48,
    queryMinScore: 10,
    scoreWeight: 2,
    virtualFeatureCount: 6000,
  },
  series: {
    featureScoreCap: 40,
    matchScoreCap: 75,
    matchPenaltyCap: 85,
    negativeScoreWeight: 2.5,
    priorAlpha: 0.25,
    queryFeatureLimit: 40,
    queryMinScore: 10,
    scoreWeight: 2,
    virtualFeatureCount: 2500,
  },
  tag: {
    featureScoreCap: 24,
    matchScoreCap: 70,
    matchPenaltyCap: 55,
    negativeScoreWeight: 1.4,
    priorAlpha: 0.35,
    queryFeatureLimit: 64,
    queryMinScore: 8,
    scoreWeight: 1,
    virtualFeatureCount: 1200,
  },
}

export function buildUserFeaturePosterior(
  signals: readonly PreferenceSignal[],
  recordMap: ReadonlyMap<number, CatalogMangaRecord>,
): UserFeaturePosterior {
  const evidenceByKind = createFeatureEvidenceMap()

  for (const signal of signals) {
    const record = recordMap.get(signal.mangaId)

    if (!record) {
      continue
    }

    addFeatureEvidence(evidenceByKind, 'artist', record.artists, signal.sentiment, signal.weight)
    addFeatureEvidence(evidenceByKind, 'character', record.characters, signal.sentiment, signal.weight)
    addFeatureEvidence(evidenceByKind, 'series', record.series, signal.sentiment, signal.weight)
    addFeatureEvidence(evidenceByKind, 'tag', record.tagValues, signal.sentiment, signal.weight)
  }

  const features = Array.from(FEATURE_KINDS).flatMap((kind) => buildKindPosteriorFeatures(kind, evidenceByKind[kind]))
  const sortedFeatures = features.sort(
    (left, right) =>
      right.score - left.score ||
      right.positiveEvidence - left.positiveEvidence ||
      left.negativeEvidence - right.negativeEvidence,
  )

  return {
    features: sortedFeatures,
    featuresByKey: new Map(sortedFeatures.map((feature) => [feature.key, feature])),
  }
}

export function getFeaturePosteriorCatalogHints(posterior: UserFeaturePosterior): FeaturePosteriorCatalogHints {
  return {
    artists: getTopFeatureValues(posterior, 'artist'),
    characters: getTopFeatureValues(posterior, 'character'),
    series: getTopFeatureValues(posterior, 'series'),
    tagValues: getTopFeatureValues(posterior, 'tag'),
  }
}

export function hasUsableFeaturePosterior(posterior: UserFeaturePosterior) {
  return posterior.features.some((feature) => feature.score >= FEATURE_POLICIES[feature.kind].queryMinScore)
}

export function scoreCatalogMangaRecordByFeaturePosterior(
  record: CatalogMangaRecord,
  posterior: UserFeaturePosterior,
): FeaturePosteriorMatch {
  const scoreByKind = createFeatureScoreMap()

  addMatchedFeatureScores(scoreByKind, posterior, 'artist', record.artists)
  addMatchedFeatureScores(scoreByKind, posterior, 'character', record.characters)
  addMatchedFeatureScores(scoreByKind, posterior, 'series', record.series)
  addMatchedFeatureScores(scoreByKind, posterior, 'tag', record.tagValues)

  const reasons: string[] = []
  let score = 0

  for (const kind of FEATURE_KINDS) {
    const kindScore = clamp(
      scoreByKind[kind],
      -FEATURE_POLICIES[kind].matchPenaltyCap,
      FEATURE_POLICIES[kind].matchScoreCap,
    )

    if (kindScore > 0) {
      reasons.push(`posterior_${kind}`)
    }

    score += kindScore
  }

  if (score > 0) {
    reasons.push('feature_posterior')
  }

  return {
    reasons,
    score: clamp(score, -100, 100),
  }
}

const FEATURE_KINDS = ['artist', 'character', 'series', 'tag'] as const satisfies readonly FeatureKind[]

type FeatureEvidence = {
  negative: number
  positive: number
}

function addFeatureEvidence(
  evidenceByKind: Record<FeatureKind, Map<string, FeatureEvidence>>,
  kind: FeatureKind,
  values: readonly string[],
  sentiment: PreferenceSignal['sentiment'],
  signalWeight: number,
) {
  const normalizedValues = uniqueNonEmptyStrings(values)

  if (normalizedValues.length === 0) {
    return
  }

  const evidence = signalWeight / Math.sqrt(normalizedValues.length)
  const evidenceMap = evidenceByKind[kind]

  for (const value of normalizedValues) {
    const featureEvidence = evidenceMap.get(value) ?? { negative: 0, positive: 0 }
    featureEvidence[sentiment] += evidence
    evidenceMap.set(value, featureEvidence)
  }
}

function addMatchedFeatureScores(
  scoreByKind: Record<FeatureKind, number>,
  posterior: UserFeaturePosterior,
  kind: FeatureKind,
  values: readonly string[],
) {
  for (const value of uniqueNonEmptyStrings(values)) {
    const feature = posterior.featuresByKey.get(getFeatureKey(kind, value))

    if (feature) {
      scoreByKind[kind] += feature.score
    }
  }
}

function buildKindPosteriorFeatures(kind: FeatureKind, evidenceMap: ReadonlyMap<string, FeatureEvidence>) {
  const policy = FEATURE_POLICIES[kind]
  const totalPositiveEvidence = Array.from(evidenceMap.values()).reduce((sum, evidence) => sum + evidence.positive, 0)
  const totalNegativeEvidence = Array.from(evidenceMap.values()).reduce((sum, evidence) => sum + evidence.negative, 0)
  const priorMean = 1 / policy.virtualFeatureCount

  if (totalPositiveEvidence <= 0 && totalNegativeEvidence <= 0) {
    return []
  }

  return Array.from(evidenceMap.entries())
    .map(([value, evidence]) => {
      const posteriorMean =
        totalPositiveEvidence > 0
          ? (policy.priorAlpha + evidence.positive) /
            (policy.priorAlpha * policy.virtualFeatureCount + totalPositiveEvidence)
          : priorMean
      const negativePosteriorMean =
        totalNegativeEvidence > 0
          ? (policy.priorAlpha + evidence.negative) /
            (policy.priorAlpha * policy.virtualFeatureCount + totalNegativeEvidence)
          : priorMean
      const logLift = Math.max(0, Math.log(posteriorMean / priorMean))
      const negativeLogLift = Math.max(0, Math.log(negativePosteriorMean / priorMean))
      const positiveScore = Math.min(
        policy.featureScoreCap,
        logLift * Math.log1p(evidence.positive) * policy.scoreWeight * 8,
      )
      const negativeScore = Math.min(
        policy.featureScoreCap,
        negativeLogLift * Math.log1p(evidence.negative) * policy.negativeScoreWeight * 8,
      )
      const score = positiveScore - negativeScore

      return {
        key: getFeatureKey(kind, value),
        kind,
        logLift,
        negativeEvidence: evidence.negative,
        negativeLogLift,
        negativeScore,
        posteriorMean,
        positiveEvidence: evidence.positive,
        positiveScore,
        priorMean,
        score,
        value,
      }
    })
    .filter((feature) => feature.positiveScore > 0 || feature.negativeScore > 0)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function createFeatureEvidenceMap(): Record<FeatureKind, Map<string, FeatureEvidence>> {
  return {
    artist: new Map(),
    character: new Map(),
    series: new Map(),
    tag: new Map(),
  }
}

function createFeatureScoreMap(): Record<FeatureKind, number> {
  return {
    artist: 0,
    character: 0,
    series: 0,
    tag: 0,
  }
}

function getFeatureKey(kind: FeatureKind, value: string) {
  return `${kind}:${value}`
}

function getTopFeatureValues(posterior: UserFeaturePosterior, kind: FeatureKind) {
  const policy = FEATURE_POLICIES[kind]

  return posterior.features
    .filter((feature) => feature.kind === kind && feature.score >= policy.queryMinScore)
    .slice(0, policy.queryFeatureLimit)
    .map((feature) => ({
      boost: feature.score,
      value: feature.value,
    }))
}

function uniqueNonEmptyStrings(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}
