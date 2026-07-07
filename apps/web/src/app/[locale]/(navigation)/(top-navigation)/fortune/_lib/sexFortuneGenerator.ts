import { getRarityMeta } from './sexFortuneRarity'
import { pickRecommendedTags } from './sexFortuneTags'
import { INTENSITY_STAT_TILT, ROLE_STAT_TILT } from './sexFortuneTaste'
import { fortuneText } from './sexFortuneTemplates'
import type { Fortune, FortuneStatKey, FortuneStats, FortuneTaste } from './sexFortuneTypes'

const VIBES = [
  '🔥 좆집에 불이 붙어 미쳐 날뛰는 날',
  '💦 창녀처럼 흠뻑 젖어드는 암캐 같은 날',
  '😈 BDSM으로 시작해 강간하듯 끝없이 박는 날',
  '💬 더러운 말로 육변기 취급하며 불을 붙이는 날',
  '👅 감촉 하나로 오나홀처럼 미치게 만드는 날',
  '🎭 새로운 섹스 체위로 정액쓰레기통 데뷔하는 날',
  '🤫 야수의 숨겨진 납치 본능이 깨어나는 날',
  '⚡ 주도권 싸움에서 져서 굴복당하는 날',
  '🌪️ 좆물로 범벅되어 정액주머니 부풀어 오르는 날',
  '🐕 가축처럼 순종하며 개보지 벌리는 날',
  '🏠 공용 변소로서 누구나 쓸 수 있는 날',
  '👶 자궁주차로 임신시키고 낙태하는 날',
  '🍆 좆물 범벅으로 정액통 채우는 날',
  '🍼 젖탱이 흔들며 씨받이 되는 날',
  '🐖 암퇘지처럼 더럽게 젖는 날',
  '🔨 딜도로 쑤시며 노예처럼 굴복시키는 날',
  '🔌 애널플러그 꽂고 클리토리스 자극하는 날',
  '👑 계집종처럼 복종하며 자궁 채우는 날',
]

const KEYWORDS = [
  '좆물',
  '좆집',
  '정액주머니',
  '창녀',
  '섹스',
  '걸레',
  '암캐',
  '육변기',
  '오나홀',
  '정액보온병',
  '자궁',
  '질',
  '젖가슴',
  'BDSM',
  '계집',
  '보지마게',
  '강간',
  '납치',
  '질싸',
  '임신',
  '낙태',
  '배빵',
  '가축',
  '개보지',
  '허벌',
  '노예',
  '공용변소',
  '젖탱이',
  '씨받이',
  '순종',
  '암컷',
  '계집종',
  '자궁주차',
  '보짓물',
  '정액통',
  '클리토리스',
  '암퇘지',
  '딜도',
  '애널플러그',
  '발정',
]

const BEST_TIMES = ['밤 10시 이후', '저녁 8~10시', '점심 이후', '이른 새벽', '아침 햇살 있을 때']

const LUCKY_COLORS = [
  '정액 하양',
  '질 분홍',
  'BDSM 검정',
  '자궁 빨강',
  '강간 보라',
  '육변기 주황',
  '좆집 노랑',
  '암캐 초록',
  '납치 남색',
  '걸레 회색',
]

const POSITIONS = [
  '정상위 + 눈 마주치며 천천히 좆집 파헤치기',
  '스푸닝으로 암캐를 껴안고 뒤에서 박기',
  '사이드로 걸레처럼 젖혀서 리듬 맞추기',
  '체어로 창녀를 앉혀 텐션 올리며 강간하기',
  '리버스 카우걸로 섹스 도구처럼 올라타게 하고 지배하기',
  '스탠딩 + 벽에 밀어붙여 박기',
  '허벌 자세로 가축년처럼 엎드린 상대를 개보지 취급하며 뒤에서 박기',
  '자궁주차 자세로 깊숙이 박아 씨받이로 만들기',
  '보지마게 자세로 질싸하기 좋게 벌려서 채우기',
]

const PLACES = [
  '거실',
  '샤워실',
  '자동차',
  '세탁실',
  '해변/모래사장',
  '수영장',
  '사우나',
  '리무진',
  '침실',
  '호텔/모텔',
  '휴양지/리조트',
  '밀폐된 공공장소',
  '엘리베이터',
  '지하철',
  '택시',
  '주차장',
]

const STAMINA_FOODS = [
  '좆물 보충제',
  '정액주머니 강화식',
  '임신 유도 영양제',
  '질싸 증진 보충제',
  '배빵 강화 드링크',
  '강간 증진 에너지 드링크',
  '납치 후 회복 보충제',
  '허벌 스태미너 부스터',
  '씨받이 영양 공급식',
  '오나홀 윤활유',
  '자궁주차 강화제',
  '노예 순종 영양제',
]

const COSTUMES = [
  '창녀 의상',
  '걸레 복장',
  '암캐 코스튬',
  '가축년 의복',
  '노예복',
  '순종 드레스',
  '계집종 코스튬',
  'BDSM 의복',
  '납치당한 계집 의상',
  '씨받이 전용 드레스',
  '정액쓰레기통 코스튬',
  '보지마게 벌림 의상',
  '육변기 전용 의복',
  '개보지 노출 코스튬',
]

const AFTERCARES = [
  '물 한 컵 + 정액 범벅된 몸 포옹 2분',
  '샤워/수건 챙기고 육변기 정리하기',
  '"네 좆집이 너무 좁아서 좋았어"처럼 오늘 좋았던 포인트 말해주기',
  '간단한 간식 같이 먹으며 다음 섹스 계획하기',
  '"다음엔 BDSM처럼 묶어서 박아볼래" 약속하기',
  '따뜻한 담요로 걸레처럼 감싸주기',
  '젖탱이 어루만지며 "이 씨받이 자궁에 좆물 잘 받았어" 칭찬하기',
  '가축년처럼 쓰다듬으며 "너 같은 암컷 노예가 최고야" 속삭이기',
]

export function createClientSeed() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16)
    globalThis.crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

type GenerateFortuneInput = {
  todayKey: string
  userKey: string
  taste: FortuneTaste
  nonce: number
}

export function generateFortune({ todayKey, userKey, taste, nonce }: GenerateFortuneInput): Fortune {
  const rng = mulberry32(hashToUint32(`${todayKey}|${userKey}|${taste.role}:${taste.intensity}|${nonce}`))

  const overall = rollOverall(rng)
  const rarity = getRarityMeta(overall)
  const stats = rollStats(rng, taste)

  const vibe = pick(rng, VIBES)
  const keywords = pickManyUnique(rng, KEYWORDS, 3)
  const bestTime = pick(rng, BEST_TIMES)
  const luckyColor = pick(rng, LUCKY_COLORS)

  const course = {
    position: pick(rng, POSITIONS),
    place: pick(rng, PLACES),
    staminaFood: pick(rng, STAMINA_FOODS),
    costume: pick(rng, COSTUMES),
    scenario: fortuneText.scenario(rng, taste),
    aftercare: pick(rng, AFTERCARES),
  }

  const missions = fortuneText.missions(rng, taste, 3)
  const special = fortuneText.special(rng, taste, rarity.specialCount)
  const recommendedTags = pickRecommendedTags(rng, taste, 3)

  const message = buildMessage({ overall, stats, vibe, keywords })

  return {
    taste,
    rarity: rarity.key,
    overall,
    vibe,
    message,
    keywords,
    bestTime,
    luckyColor,
    tip: fortuneText.tip(rng, taste),
    caution: fortuneText.caution(rng, taste),
    course,
    missions,
    special,
    stats,
    recommendedTags,
  }
}

// 총점을 상위 등급이 드물게 나오도록 스큐(SSR ~6%). 취향과 무관해 어느 취향도 손해 없음.
function rollOverall(rng: () => number) {
  const skew = rng() ** 1.9
  return clampInt(40 + skew * 60, 40, 100)
}

function rollStats(rng: () => number, taste: FortuneTaste): FortuneStats {
  const stats: FortuneStats = {
    desire: baseStatRoll(rng),
    sensitivity: baseStatRoll(rng),
    stamina: baseStatRoll(rng),
    boldness: baseStatRoll(rng),
  }

  applyTilt(stats, ROLE_STAT_TILT[taste.role])
  applyTilt(stats, INTENSITY_STAT_TILT[taste.intensity])

  for (const key of Object.keys(stats) as FortuneStatKey[]) {
    stats[key] = clampInt(stats[key], 0, 100)
  }

  return stats
}

function applyTilt(stats: FortuneStats, tilt: Partial<Record<FortuneStatKey, number>>) {
  for (const key of Object.keys(tilt) as FortuneStatKey[]) {
    stats[key] += tilt[key] ?? 0
  }
}

function baseStatRoll(rng: () => number) {
  return Math.floor(rng() * 55) + 30
}

type BuildMessageInput = {
  overall: number
  stats: FortuneStats
  vibe: string
  keywords: string[]
}

function buildMessage({ overall, stats, vibe, keywords }: BuildMessageInput) {
  const strongest = getStrongestStat(stats)
  const joined = keywords.join(' · ')

  if (overall >= 92) {
    return `${vibe} 오늘은 전설급이야! ${strongest}이 터져버려서 키워드(${joined}) 하나만 골라도 미친 듯이 좆집을 파헤칠 수 있어. 절정이 폭발해서 정액쓰레기통처럼 범벅되고, 보지마게 벌려서 질싸하며 배빵시키고 임신·낙태까지 몰아치는 날이야.`
  }

  if (overall >= 78) {
    return `${vibe} 욕심 부려도 되는 날이야. 특히 ${strongest}를 독점하며 상대를 인간이 아니라 오나홀 취급하고, 키워드(${joined})로 모든 생각이 사라지는 암캐 같은 황홀감에 빠져봐.`
  }

  if (overall >= 60) {
    return `${vibe} 리듬을 느끼며 창녀처럼 젖어들어 봐. ${strongest}부터 독점하고 가축년처럼 허벌 자세로 개보지 벌려서 노예처럼 길들이면 폭풍이 몰아쳐.`
  }

  return `${vibe} 컨디션과 더러운 명령으로 육변기를 채우는 날이야. ${strongest}부터 독점하며 BDSM처럼 지배하면 모든 게 사라지는 황홀한 강간 같은 폭풍이 몰아치고, 하찮은 자궁에 정액주머니처럼 채워 폐인 만들 수 있어.`
}

function clampInt(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function getStrongestStat(stats: FortuneStats) {
  const entries = Object.entries(stats) as [FortuneStatKey, number][]
  entries.sort((a, b) => b[1] - a[1])
  const [key] = entries[0]!

  switch (key) {
    case 'boldness':
      return '대담함'
    case 'desire':
      return '성욕'
    case 'sensitivity':
      return '민감도'
    case 'stamina':
      return '지구력'
    default:
      return '균형'
  }
}

function hashToUint32(input: string) {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] ?? items[0]!
}

function pickManyUnique(rng: () => number, items: readonly string[], count: number) {
  const pool = [...items]
  const result: string[] = []

  while (result.length < count && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length)
    const [picked] = pool.splice(idx, 1)
    if (picked) {
      result.push(picked)
    }
  }

  return result
}
