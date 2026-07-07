import type { FortuneIntensity, FortuneRole, FortuneStatKey } from './sexFortuneTypes'

export type FortuneRoleOption = {
  key: FortuneRole
  label: string
  emoji: string
  desc: string
}

export type FortuneIntensityOption = {
  key: FortuneIntensity
  label: string
  emoji: string
  desc: string
}

export const FORTUNE_ROLES: readonly FortuneRoleOption[] = [
  { key: 'dominant', label: '지배', emoji: '😈', desc: '올라타서 짓밟는 쪽' },
  { key: 'submissive', label: '복종', emoji: '🐕', desc: '깔려서 굴복하는 쪽' },
  { key: 'switch', label: '스위치', emoji: '🔄', desc: '주도권이 뒤집히는 쪽' },
]

export const FORTUNE_INTENSITIES: readonly FortuneIntensityOption[] = [
  { key: 'intense', label: '격정', emoji: '🔥', desc: '미친 듯이 몰아치기' },
  { key: 'slow', label: '느긋', emoji: '💧', desc: '천천히 녹여버리기' },
]

// 스탯 단일 정의(라벨 3중 불일치 제거): 키 → 라벨
export const FORTUNE_STAT_META: readonly { key: FortuneStatKey; label: string }[] = [
  { key: 'desire', label: '성욕' },
  { key: 'sensitivity', label: '민감도' },
  { key: 'stamina', label: '지구력' },
  { key: 'boldness', label: '대담함' },
]

// 역할·강도가 스탯에 주는 가산 편향(0~100 클램프 전)
export const ROLE_STAT_TILT: Record<FortuneRole, Partial<Record<FortuneStatKey, number>>> = {
  dominant: { boldness: 16, desire: 8 },
  submissive: { sensitivity: 16, stamina: 8 },
  switch: { desire: 6, sensitivity: 6, boldness: 6 },
}

export const INTENSITY_STAT_TILT: Record<FortuneIntensity, Partial<Record<FortuneStatKey, number>>> = {
  intense: { desire: 14, boldness: 10 },
  slow: { sensitivity: 14, stamina: 10 },
}
