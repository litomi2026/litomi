import { getRarityMetaByKey } from './rarity'
import { FORTUNE_INTENSITIES, FORTUNE_ROLES } from './taste'
import type { Fortune } from './types'

type BuildShareTextInput = {
  todayKey: string
  fortune: Fortune
  origin: string
}

export function buildShareText({ todayKey, fortune, origin }: BuildShareTextInput) {
  const rarity = getRarityMetaByKey(fortune.rarity)
  const role = FORTUNE_ROLES.find((option) => option.key === fortune.taste.role)
  const intensity = FORTUNE_INTENSITIES.find((option) => option.key === fortune.taste.intensity)
  const tasteLabel = [role?.label, intensity?.label].filter(Boolean).join(' · ')

  return [
    `오늘의 운세 (${todayKey})`,
    `${fortune.rarity} ${rarity.label} · ${fortune.overall}점`,
    `취향: ${tasteLabel}`,
    `키워드: ${fortune.keywords.join(' · ')}`,
    `한줄: ${fortune.message}`,
    '',
    '추천 코스',
    `- 체위: ${fortune.course.position}`,
    `- 장소: ${fortune.course.place}`,
    `- 시나리오: ${fortune.course.scenario}`,
    `- 애프터케어: ${fortune.course.aftercare}`,
    '',
    `열어보기: ${new URL('/fortune', origin).toString()}`,
  ].join('\n')
}
