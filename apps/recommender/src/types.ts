export type Candidate = {
  mangaId: number
  reasonMask: number
  score: number
}

export type CandidateRow = {
  mangaId: number
  reasonMask: number
  score: number
}

export type GenerateOptions = {
  itemLimit?: number
}

export type MangaRecommendation = {
  mangaId: number
  rank: number
  reasonMask: number
  score: number
  generatedAt: Date
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
