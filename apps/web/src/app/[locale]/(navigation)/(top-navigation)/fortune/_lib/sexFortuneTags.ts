import { normalizeValue } from '@litomi/domain/utils/normalize-value'

import type { FortuneRole, FortuneTagRecommendation, FortuneTaste } from './sexFortuneTypes'

type FortuneTagSeed = {
  label: string
  tag: string
  category: FortuneTagRecommendation['category']
  roles: readonly FortuneRole[]
}

// 운세 테마 → 태그 사전(apps/web tag-dictionary)에 실재하는 태그로만 매핑. 실제 검색 결과가 나와야 함.
const FORTUNE_TAG_SEEDS: readonly FortuneTagSeed[] = [
  { label: 'BDSM 조교', tag: 'bdsm', category: 'female', roles: ['dominant', 'switch'] },
  { label: '결박', tag: 'bondage', category: 'female', roles: ['dominant', 'switch'] },
  { label: '강제 절정', tag: 'rape', category: 'female', roles: ['dominant'] },
  { label: '임신시키기', tag: 'impregnation', category: 'female', roles: ['dominant'] },
  { label: '질내사정', tag: 'nakadashi', category: 'female', roles: ['dominant', 'submissive', 'switch'] },
  { label: '정신붕괴', tag: 'mind break', category: 'female', roles: ['dominant', 'switch'] },
  { label: '아헤가오', tag: 'ahegao', category: 'female', roles: ['dominant', 'submissive', 'switch'] },
  { label: '애완 조련', tag: 'petplay', category: 'female', roles: ['submissive', 'switch'] },
  { label: '목줄', tag: 'collar', category: 'female', roles: ['submissive'] },
  { label: '메이드', tag: 'maid', category: 'female', roles: ['submissive'] },
  { label: '여성 상위', tag: 'femdom', category: 'female', roles: ['submissive', 'switch'] },
  { label: 'NTR', tag: 'netorare', category: 'female', roles: ['switch'] },
  { label: '임신', tag: 'pregnant', category: 'female', roles: ['dominant', 'submissive', 'switch'] },
  { label: '거유', tag: 'big breasts', category: 'female', roles: ['dominant', 'submissive', 'switch'] },
  { label: '모유', tag: 'lactation', category: 'female', roles: ['submissive', 'switch'] },
  { label: '스타킹', tag: 'stockings', category: 'female', roles: ['dominant', 'submissive', 'switch'] },
  { label: '애널', tag: 'anal', category: 'female', roles: ['dominant', 'switch'] },
  { label: '이중삽입', tag: 'double penetration', category: 'female', roles: ['dominant', 'switch'] },
]

function toRecommendation(seed: FortuneTagSeed): FortuneTagRecommendation {
  const query = `${seed.category}:${normalizeValue(seed.tag)}`
  return {
    label: seed.label,
    tag: seed.tag,
    category: seed.category,
    href: `/search?query=${encodeURIComponent(query)}`,
  }
}

export function pickRecommendedTags(rng: () => number, taste: FortuneTaste, count: number): FortuneTagRecommendation[] {
  const weighted = FORTUNE_TAG_SEEDS.map((seed) => ({
    seed,
    weight: seed.roles.includes(taste.role) ? 3 : 1,
  }))

  const result: FortuneTagRecommendation[] = []
  const pool = [...weighted]

  while (result.length < count && pool.length > 0) {
    const total = pool.reduce((acc, item) => acc + item.weight, 0)
    let threshold = rng() * total
    let index = 0

    for (let i = 0; i < pool.length; i++) {
      threshold -= pool[i]!.weight
      if (threshold <= 0) {
        index = i
        break
      }
    }

    const [picked] = pool.splice(index, 1)
    if (picked) {
      result.push(toRecommendation(picked.seed))
    }
  }

  return result
}
