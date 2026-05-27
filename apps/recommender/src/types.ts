import type { Manga } from '@litomi/domain/manga/model'

export type Candidate = {
  mangaId: number
  reasons: Set<string>
  score: number
}

export type CandidateRow = {
  mangaId: number
  score: number
  reasons: string[] | null
}

export type GenerateOptions = {
  itemLimit?: number
}

export type MangaRecommendation = {
  mangaId: number
  rank: number
  score: number
  reasons: string[]
  generatedAt: Date
  manga?: Manga
}

export type PreferenceSignal = Signal & {
  sentiment: SignalSentiment
}

export type SelectActiveUserOptions = {
  activeDays?: number
  limit?: number
}

export type Signal = {
  mangaId: number
  weight: number
}

export type SignalSentiment = 'negative' | 'positive'
