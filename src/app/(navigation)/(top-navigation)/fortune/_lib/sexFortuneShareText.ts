import type { Fortune } from './sexFortuneTypes'

export function buildSexFortuneShareText({
  todayKey,
  fortune,
  origin,
}: {
  todayKey: string
  fortune: Fortune
  origin: string
}) {
  return [
    `오늘의 섹스 운세 (${todayKey})`,
    `총점: ${fortune.overall}점`,
    `키워드: ${fortune.keywords.join(' · ')}`,
    `한줄: ${fortune.message}`,
    '',
    `추천 코스`,
    `- 체위: ${fortune.course.position}`,
    `- 장소: ${fortune.course.place}`,
    `- 정력 음식: ${fortune.course.staminaFood}`,
    `- 코스튬: ${fortune.course.costume}`,
    `- 시나리오: ${fortune.course.scenario}`,
    `- 애프터케어: ${fortune.course.aftercare}`,
    '',
    `열어보기: ${new URL('/sex-fortune', origin).toString()}`,
  ].join('\n')
}
