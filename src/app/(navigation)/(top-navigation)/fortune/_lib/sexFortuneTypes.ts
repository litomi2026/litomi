export type Fortune = {
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
  stats: {
    chemistry: number
    stamina: number
    communication: number
    boldness: number
  }
}

export type SexFortuneTab = 'course' | 'fortune' | 'special'
