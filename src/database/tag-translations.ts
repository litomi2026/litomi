import tagCategoryJSON from '@/database/translation/tag-category.json'
import tagValueJSON from '@/database/translation/tag-value.json'
import tagTranslationJSON from '@/database/translation/tag.json'

export type Multilingual = {
  en: string
  ko?: string
  ja?: string
  'zh-CN'?: string
  'zh-TW'?: string
}

const TAG_VALUE_TRANSLATION: Record<string, Multilingual> = tagValueJSON
const TAG_CATEGORY_TRANSLATION: Record<string, Multilingual> = tagCategoryJSON
const TAG_TRANSLATION: Record<string, Multilingual> = tagTranslationJSON

export type TagCategory = 'female' | 'male' | 'mixed' | 'other'

interface TagPattern {
  category: TagCategory
  pattern: RegExp
}

const TAG_PATTERNS: TagPattern[] = [
  { pattern: /^(\w+)_threesome$/, category: 'mixed' },
  { pattern: /^(\w*)group$/, category: 'mixed' },
  { pattern: /^(\w*)incest$/, category: 'mixed' },
  { pattern: /^(\w*)inseki$/, category: 'mixed' },
]

export function normalizeTagValue(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '_').trim()
}

export function sortTagValue(value: string): TagCategory {
  const normalizedValue = normalizeTagValue(value)

  for (const { pattern, category } of TAG_PATTERNS) {
    if (pattern.test(normalizedValue)) {
      return category
    }
  }

  return 'other'
}

export function translateTag(category: string, value: string, locale: keyof Multilingual) {
  const tag = `${category}:${value}`
  const translatedCategory = translateTagCategory(category, locale)
  const translatedValue = TAG_TRANSLATION[tag]?.[locale] || TAG_TRANSLATION[tag]?.en || translateTagValue(value, locale)
  return `${translatedCategory}:${translatedValue}`
}

export function translateTagCategory(category: string, locale: keyof Multilingual): string {
  const translation = TAG_CATEGORY_TRANSLATION[category]
  return translation?.[locale] || translation?.en || category.replace(/_/g, ' ')
}

export function translateTagValue(value: string, locale: keyof Multilingual): string {
  const translation = TAG_VALUE_TRANSLATION[normalizeTagValue(value)]
  return translation?.[locale] || translation?.en || value.replace(/_/g, ' ')
}
