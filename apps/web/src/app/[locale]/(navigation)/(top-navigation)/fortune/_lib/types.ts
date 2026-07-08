export type FortuneRole = 'dominant' | 'submissive' | 'switch'

export type FortuneIntensity = 'intense' | 'slow'

export type FortuneTaste = {
  role: FortuneRole
  intensity: FortuneIntensity
}

export type FortuneRarity = 'N' | 'R' | 'SR' | 'SSR'

export type FortuneStatKey = 'boldness' | 'desire' | 'sensitivity' | 'stamina'

export type FortuneStats = Record<FortuneStatKey, number>

export type FortuneTagRecommendation = {
  label: string
  tag: string
  category: 'female' | 'male' | 'mixed' | 'other'
  href: string
}

export type Fortune = {
  taste: FortuneTaste
  rarity: FortuneRarity
  overall: number
  vibe: string
  message: string
  keywords: string[]
  bestTime: string
  luckyColor: string
  tip: string
  caution: string
  course: {
    position: string
    place: string
    staminaFood: string
    costume: string
    scenario: string
    aftercare: string
  }
  missions: string[]
  special: string[]
  stats: FortuneStats
  recommendedTags: FortuneTagRecommendation[]
}

export type SexFortuneTab = 'course' | 'fortune' | 'special'
