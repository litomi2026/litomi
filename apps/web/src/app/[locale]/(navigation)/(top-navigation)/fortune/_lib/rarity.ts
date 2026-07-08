import type { FortuneRarity } from './types'

export type FortuneRarityMeta = {
  key: FortuneRarity
  label: string
  min: number
  accent: string
  glow: string
  specialCount: number
}

// 총점 구간별 등급. specialCount = '특별' 탭에서 열리는 시나리오 개수(레어도 게이팅).
export const FORTUNE_RARITIES: readonly FortuneRarityMeta[] = [
  { key: 'SSR', label: '전설', min: 92, accent: '#fbbf24', glow: 'rgba(251,191,36,0.45)', specialCount: 4 },
  { key: 'SR', label: '희귀', min: 78, accent: '#a855f7', glow: 'rgba(168,85,247,0.4)', specialCount: 3 },
  { key: 'R', label: '레어', min: 60, accent: '#60a5fa', glow: 'rgba(96,165,250,0.35)', specialCount: 2 },
  { key: 'N', label: '평범', min: 0, accent: '#a1a1aa', glow: 'rgba(161,161,170,0.25)', specialCount: 1 },
]

export function getRarityMeta(overall: number): FortuneRarityMeta {
  return FORTUNE_RARITIES.find((tier) => overall >= tier.min) ?? FORTUNE_RARITIES[FORTUNE_RARITIES.length - 1]!
}

export function getRarityMetaByKey(key: FortuneRarity): FortuneRarityMeta {
  return FORTUNE_RARITIES.find((tier) => tier.key === key) ?? FORTUNE_RARITIES[FORTUNE_RARITIES.length - 1]!
}
