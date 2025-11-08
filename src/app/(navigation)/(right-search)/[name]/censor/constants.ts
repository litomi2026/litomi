import { BLIND_TAG_VALUE_TO_LABEL, BLIND_TAG_VALUES } from '@/constants/json'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'

export const CENSORSHIP_KEY_LABELS: Record<CensorshipKey, string> = {
  [CensorshipKey.ARTIST]: '작가',
  [CensorshipKey.GROUP]: '그룹',
  [CensorshipKey.SERIES]: '시리즈',
  [CensorshipKey.CHARACTER]: '캐릭터',
  [CensorshipKey.TAG]: '태그',
  [CensorshipKey.TAG_CATEGORY_FEMALE]: '여성 태그',
  [CensorshipKey.TAG_CATEGORY_MALE]: '남성 태그',
  [CensorshipKey.TAG_CATEGORY_MIXED]: '혼합 태그',
  [CensorshipKey.TAG_CATEGORY_OTHER]: '기타 태그',
  [CensorshipKey.LANGUAGE]: '언어',
  [CensorshipKey.UPLOADER]: '업로더',
}

export const TYPE_PATTERNS: Record<string, CensorshipKey> = {
  'artist:': CensorshipKey.ARTIST,
  'group:': CensorshipKey.GROUP,
  'series:': CensorshipKey.SERIES,
  'character:': CensorshipKey.CHARACTER,
  'female:': CensorshipKey.TAG_CATEGORY_FEMALE,
  'male:': CensorshipKey.TAG_CATEGORY_MALE,
  'mixed:': CensorshipKey.TAG_CATEGORY_MIXED,
  'other:': CensorshipKey.TAG_CATEGORY_OTHER,
  'language:': CensorshipKey.LANGUAGE,
  'uploader:': CensorshipKey.UPLOADER,
}

export const CENSORSHIP_LEVEL_LABELS: Record<CensorshipLevel, { label: string; color: string }> = {
  [CensorshipLevel.LIGHT]: {
    label: '흐리게',
    color: 'text-yellow-500',
  },
  [CensorshipLevel.HEAVY]: {
    label: '숨기기',
    color: 'text-red-500',
  },
  [CensorshipLevel.NONE]: {
    label: '해제',
    color: 'text-green-500',
  },
}

export const LABEL_TO_VALUES = BLIND_TAG_VALUES.reduce<Record<string, string[]>>((acc, tag) => {
  const label = BLIND_TAG_VALUE_TO_LABEL[tag]
  if (!acc[label]) acc[label] = []
  acc[label].push(tag)
  return acc
}, {})

export const DEFAULT_CENSORED_TAGS = Object.entries(LABEL_TO_VALUES).map(([label, values]) => {
  return `${label} (${values.join(', ')})`
})

export const BLIND_TAG_SUGGESTIONS = BLIND_TAG_VALUES.map((value) => ({
  value,
  label: BLIND_TAG_VALUE_TO_LABEL[value],
}))

export const CENSORSHIP_PREFIX_SET = new Set([
  'artist:',
  'character:',
  'female:',
  'group:',
  'language:',
  'male:',
  'mixed:',
  'other:',
  'series:',
  'type:',
  'uploader:',
])
