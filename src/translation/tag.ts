import 'server-only'

import tagCategoryJSON from '@/translation/tag-category.json'
import tagMaleFemaleJSON from '@/translation/tag-male-female.json'
import tagMixedJSON from '@/translation/tag-mixed.json'
import tagOtherJSON from '@/translation/tag-other.json'
import tagTranslationJSON from '@/translation/tag.json'
import { MangaTag, MangaTagCategory } from '@/types/manga'

import { Multilingual, normalizeValue } from './common'

const TAG_MALE_FEMALE_TRANSLATION: Record<string, Multilingual | undefined> = tagMaleFemaleJSON
const TAG_OTHER_TRANSLATION: Record<string, Multilingual | undefined> = tagOtherJSON
const TAG_MIXED_TRANSLATION: Record<string, Multilingual | undefined> = tagMixedJSON
const TAG_CATEGORY_TRANSLATION: Record<string, Multilingual | undefined> = tagCategoryJSON
const TAG_TRANSLATION: Record<string, Multilingual | undefined> = tagTranslationJSON

interface TagPattern {
  category: MangaTagCategory
  pattern: RegExp
}

const TAG_PATTERNS: TagPattern[] = [
  { pattern: /^(\w+)_threesome$/, category: 'mixed' },
  { pattern: /^(\w*)group$/, category: 'mixed' },
  { pattern: /^(\w*)incest$/, category: 'mixed' },
  { pattern: /^(\w*)inseki$/, category: 'mixed' },
]

export function sortTagValue(value: string): MangaTagCategory {
  const normalizedValue = normalizeValue(value)

  for (const { pattern, category } of TAG_PATTERNS) {
    if (pattern.test(normalizedValue)) {
      return category
    }
  }

  return 'other'
}

// TODO: tag.json 등 분류 완료되면 category 없이도 번역 가능하게 하기
export function translateTag(category: string, value: string, locale: keyof Multilingual): MangaTag {
  const normalizedValue = normalizeValue(value)
  const sanitizedCategory = sanitizeTagCategory(category)
  const tag = `${sanitizedCategory}:${normalizedValue}`
  const translatedCategory = translateTagCategory(sanitizedCategory, locale)

  const translatedValue =
    TAG_TRANSLATION[tag]?.[locale] || TAG_TRANSLATION[tag]?.en || translateTagValue(normalizedValue, locale)

  return {
    category: sanitizedCategory,
    value: normalizedValue,
    label: `${translatedCategory}:${translatedValue}`,
  }
}

function sanitizeTagCategory(category: string): MangaTagCategory {
  switch (category) {
    case 'female':
    case 'male':
    case 'mixed':
    case 'other':
      return category
    default:
      return 'other'
  }
}

function translateTagCategory(category: string, locale: keyof Multilingual): string {
  const translation = TAG_CATEGORY_TRANSLATION[category]
  return translation?.[locale] || translation?.en || category
}

function translateTagValue(value: string, locale: keyof Multilingual): string {
  const translation = TAG_MALE_FEMALE_TRANSLATION[value] || TAG_MIXED_TRANSLATION[value] || TAG_OTHER_TRANSLATION[value]
  return translation?.[locale] || translation?.en || value
}
