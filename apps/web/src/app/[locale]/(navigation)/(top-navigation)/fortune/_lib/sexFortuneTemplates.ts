import { attachJosa, type JosaKind } from './sexFortuneJosa'
import type { FortuneRole, FortuneTaste } from './sexFortuneTypes'

// 공유 어휘(수위 유지). 슬롯에 채워져 문장이 곱연산으로 조합됨.
const LEXICON = {
  target: [
    '이 창녀',
    '이 암캐',
    '이 육변기',
    '이 걸레년',
    '이 씨받이',
    '이 계집종',
    '이 가축년',
    '이 오나홀',
    '이 정액쓰레기통',
    '이 개보지',
    '이 공용변소',
    '이 암퇘지',
  ],
  selfRef: [
    '나 같은 육변기',
    '나 같은 암캐',
    '이 걸레년',
    '나 같은 정액쓰레기통',
    '나 같은 오나홀',
    '이 씨받이',
    '나 같은 개보지',
    '이 노예 계집',
    '나 같은 공용변소',
  ],
  bodypart: ['좆집', '자궁', '질', '보지', '젖탱이', '클리토리스', '개보지', '씨받이 자궁'],
  actDom: ['박아', '파헤쳐', '쑤셔', '채워', '짓밟아', '후벼', '벌려'],
  actSub: ['박혀', '파헤쳐져', '쑤셔져', '채워져', '짓밟혀', '후벼파져', '벌려져'],
  climax: ['질싸', '배빵', '임신', '낙태', '자궁주차'],
  intenseAdv: ['미친 듯이', '끝없이', '세게', '깊숙이', '거칠게', '짐승처럼', '무자비하게'],
  slowAdv: ['천천히', '나른하게', '집요하게', '부드럽게', '끈적하게', '느릿느릿', '농밀하게'],
  command: [
    '"이 창녀 같은 구멍에 내 자지 박아넣고 싶어 미쳐"',
    '"너 같은 육변기는 그냥 구멍일 뿐이야"',
    '"이 씨받이 자궁에 좆물 쏟아부어 임신시켜줄게"',
    '"너 같은 가축년은 자궁주차장일 뿐이야"',
    '"이 계집종은 누구나 쓸 수 있는 구멍이야"',
    '"세상이 사라질 때까지 박아줄게"',
  ],
  plead: [
    '"제발 더 세게 박아줘"',
    '"이 육변기 구멍 마음대로 써줘"',
    '"좆물로 자궁 채워서 임신시켜줘"',
    '"가축처럼 길들여줘"',
    '"세상이 사라지게 짓밟아줘"',
    '"정액쓰레기통으로 써줘"',
  ],
} as const

type TemplateBank = Record<Exclude<FortuneRole, 'switch'>, readonly string[]>

// 슬롯 문법: {slot} 또는 {slot:josa}. josa = 을·를·가·로 (받침에 맞춰 자동 선택).
// 지배=능동(대상을 ~시킨다), 복종=피동(내가 ~당한다). 리스트 항목은 -기로 종결.
const TIP: TemplateBank = {
  dominant: [
    '{bodypart:을} {adv} {actDom} {command}라고 윽박지르며 {target:을} {climax}시켜버려.',
    '{target:을} 인간이 아니라 구멍으로 취급하며 {adv} {actDom} {climax}시켜.',
    '{command}라고 명령하며 {target:을} {adv} {actDom} {climax}시켜서 폐인으로 만들어버려.',
  ],
  submissive: [
    '{selfRef:가} 되어 {bodypart:을} 벌리고 {plead}라고 애원하며 {adv} {climax} 당해봐.',
    '{adv} 짓밟히면서 {plead}라고 신음하고 {bodypart:가} {actSub} {climax} 당하는 쾌락에 빠져.',
    '{selfRef}처럼 순종하며 {plead}라고 애원하고 {bodypart:가} {adv} {actSub}.',
  ],
}

const CAUTION: TemplateBank = {
  dominant: [
    '너무 몰아치면 황홀함이 깨져. 오늘은 {target:을} {adv} 맛만 보고 "내일 더 세게 {climax}시켜줄게"라고 약속해.',
    '급하게 굴지 말고 {adv} {target}의 {bodypart:을} 먼저 길들여. 그 긴장이 {climax}의 황홀감을 키워.',
  ],
  submissive: [
    '너무 빨리 무너지지 말고 {adv} 짓밟히는 순간을 즐겨. {selfRef:로}서 {climax} 당하기 직전의 애원이 절정을 키워.',
    '컨디션이 안 좋으면 {selfRef}처럼 {adv} 봉사만 하고 쉬어. 내일의 미친 {climax:을} 위한 준비운동으로 써.',
  ],
}

const SCENARIO: TemplateBank = {
  dominant: [
    '{target:을} {adv} {actDom} {climax}시키기',
    '{command}라고 윽박지르며 {bodypart:을} {adv} {actDom} 폐인으로 만들기',
    '{target:을} 공용변소처럼 취급하며 누구나 쓸 수 있는 구멍으로 {climax}시키기',
  ],
  submissive: [
    '{selfRef:가} 되어 {adv} {actSub} {plead}라고 애원하며 {climax} 당하기',
    '{bodypart:을} 벌린 채 {adv} 짓밟히며 {climax} 당하기',
    '{plead}라고 신음하며 {selfRef}처럼 {adv} {actSub} 무너지기',
  ],
}

const MISSION: TemplateBank = {
  dominant: [
    '{target}의 {bodypart:을} 노려보며 {command}라고 3번 속삭이기',
    '{target:을} {adv} {actDom} {climax} 예고하기',
    '{target:을} {bodypart}만 남은 구멍으로 취급하며 {adv} 지배하기',
  ],
  submissive: [
    '{selfRef:로}서 {plead}라고 3번 애원하기',
    '{bodypart:을} 벌리고 {adv} 짓밟히며 {climax} 기다리기',
    '{selfRef}처럼 순종하며 {adv} {actSub} 무너지기',
  ],
}

const SPECIAL: TemplateBank = {
  dominant: [
    '{target:을} 시골 단칸방에 가둬 {adv} 길들이고 {bodypart:을} {actDom} {climax}시켜 씨받이로 만들기',
    '{command}라고 윽박지르며 {target:을} 노예처럼 조련해 {climax}시켜 폐인으로 각인시키기',
    '{target}의 {bodypart:을} {adv} 헤집으며 {climax:을} 반복시키는 육성 계획 세우기',
    '{target:을} 공용 변소로 개방해 누구나 {adv} {actDom} {climax}시키게 만들기',
  ],
  submissive: [
    '{selfRef:가} 되어 {adv} 조련당하며 {bodypart:가} {actSub} {climax} 각인되기',
    '{plead}라고 애원하며 {selfRef:로} 시골 단칸방에 갇혀 {climax} 당하며 폐인 되기',
    '{bodypart:을} 벌린 채 {adv} 짓밟히며 임신과 낙태를 반복 당하는 씨받이 되기',
    '{selfRef:로} 공용 변소가 되어 누구에게나 {adv} {actSub} {climax} 당하기',
  ],
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] ?? items[0]!
}

function resolveRole(rng: () => number, role: FortuneRole): Exclude<FortuneRole, 'switch'> {
  if (role === 'switch') {
    return rng() < 0.5 ? 'dominant' : 'submissive'
  }
  return role
}

function fillTemplate(rng: () => number, template: string, taste: FortuneTaste): string {
  const advPool = taste.intensity === 'intense' ? LEXICON.intenseAdv : LEXICON.slowAdv

  return template.replace(/\{(\w+)(?::([가-힣]+))?\}/g, (_, slot: string, josa?: string) => {
    let value: string
    switch (slot) {
      case 'adv':
        value = pick(rng, advPool)
        break
      case 'target':
        value = pick(rng, LEXICON.target)
        break
      case 'selfRef':
        value = pick(rng, LEXICON.selfRef)
        break
      case 'bodypart':
        value = pick(rng, LEXICON.bodypart)
        break
      case 'actDom':
        value = pick(rng, LEXICON.actDom)
        break
      case 'actSub':
        value = pick(rng, LEXICON.actSub)
        break
      case 'climax':
        value = pick(rng, LEXICON.climax)
        break
      case 'command':
        value = pick(rng, LEXICON.command)
        break
      case 'plead':
        value = pick(rng, LEXICON.plead)
        break
      default:
        value = ''
    }

    return josa ? attachJosa(value, josa as JosaKind) : value
  })
}

function renderFrom(rng: () => number, bank: TemplateBank, taste: FortuneTaste): string {
  const role = resolveRole(rng, taste.role)
  return fillTemplate(rng, pick(rng, bank[role]), taste)
}

function renderManyUnique(rng: () => number, bank: TemplateBank, taste: FortuneTaste, count: number): string[] {
  const result: string[] = []
  let guard = 0
  while (result.length < count && guard < count * 8) {
    guard++
    const candidate = renderFrom(rng, bank, taste)
    if (!result.includes(candidate)) {
      result.push(candidate)
    }
  }
  return result
}

export const fortuneText = {
  tip: (rng: () => number, taste: FortuneTaste) => renderFrom(rng, TIP, taste),
  caution: (rng: () => number, taste: FortuneTaste) => renderFrom(rng, CAUTION, taste),
  scenario: (rng: () => number, taste: FortuneTaste) => renderFrom(rng, SCENARIO, taste),
  missions: (rng: () => number, taste: FortuneTaste, count: number) => renderManyUnique(rng, MISSION, taste, count),
  special: (rng: () => number, taste: FortuneTaste, count: number) => renderManyUnique(rng, SPECIAL, taste, count),
}
