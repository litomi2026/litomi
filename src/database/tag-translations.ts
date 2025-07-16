import tagCategoryJSON from '@/database/translation/tag-category.json'
import tagMaleFemaleJSON from '@/database/translation/tag-male-female.json'
import tagMixedJSON from '@/database/translation/tag-mixed.json'
import tagOtherJSON from '@/database/translation/tag-other.json'
import tagTranslationJSON from '@/database/translation/tag.json'
import { MangaTagCategory } from '@/types/manga'

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

export function translateTag(category: string, value: string, locale: keyof Multilingual) {
  const tag = `${category}:${normalizeValue(value)}`
  const translatedCategory = translateTagCategory(category, locale)
  const translatedValue = TAG_TRANSLATION[tag]?.[locale] || TAG_TRANSLATION[tag]?.en || translateTagValue(value, locale)
  return `${translatedCategory}:${translatedValue}`
}

export function translateTagCategory(category: string, locale: keyof Multilingual): string {
  const translation = TAG_CATEGORY_TRANSLATION[category]
  return translation?.[locale] || translation?.en || category.replace(/_/g, ' ')
}

export function translateTagValue(value: string, locale: keyof Multilingual): string {
  const normalizedValue = normalizeValue(value)

  const translation =
    TAG_MALE_FEMALE_TRANSLATION[normalizedValue] ||
    TAG_MIXED_TRANSLATION[normalizedValue] ||
    TAG_OTHER_TRANSLATION[normalizedValue]

  return translation?.[locale] || translation?.en || value.replace(/_/g, ' ')
}
