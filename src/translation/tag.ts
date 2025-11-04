import 'server-only'

import { MangaTag } from '@/types/manga'

import { Multilingual, normalizeValue } from './common'
import tagCategoryJSON from './tag-category.json'
import tagMixedJSON from './tag-mixed.json'
import tagOtherJSON from './tag-other.json'
import tagSingleSexJSON from './tag-single-sex.json'
import tagUnisexTranslations from './tag-unisex.json'

const TAG_CATEGORY_TRANSLATION: Record<string, Multilingual | undefined> = tagCategoryJSON
const TAG_MIXED_TRANSLATION: Record<string, Multilingual | undefined> = tagMixedJSON
const TAG_OTHER_TRANSLATION: Record<string, Multilingual | undefined> = tagOtherJSON
const TAG_SINGLE_SEX_TRANSLATION: Record<string, Multilingual | undefined> = tagSingleSexJSON
const TAG_UNISEX_TRANSLATION: Record<string, Multilingual | undefined> = tagUnisexTranslations

export function translateTag(categoryFallback: string, value: string, locale: keyof Multilingual): MangaTag {
  const normalizedValue = normalizeValue(value)
  const { translation, category } = findTranslation(normalizedValue, categoryFallback)
  const translatedCategory = translateTagCategory(category, locale)
  const translatedValue = translation?.[locale] || translation?.en || normalizedValue

  return {
    category,
    value: normalizedValue,
    label: `${translatedCategory}:${translatedValue}`,
  }
}

function findTranslation(
  normalizedValue: string,
  category: string,
): {
  translation: Multilingual | null
  category: string
} {
  const translation = TAG_SINGLE_SEX_TRANSLATION[`${category}:${normalizedValue}`]
  if (translation) {
    return {
      translation,
      category,
    }
  }

  const mixedTranslation = TAG_MIXED_TRANSLATION[normalizedValue]
  if (mixedTranslation) {
    return {
      translation: mixedTranslation,
      category: 'mixed',
    }
  }

  const maleFemaleMixedTranslation = TAG_UNISEX_TRANSLATION[normalizedValue]
  if (maleFemaleMixedTranslation) {
    return {
      translation: maleFemaleMixedTranslation,
      category: ['female', 'male', 'mixed'].includes(category) ? category : 'other',
    }
  }

  const otherTranslation = TAG_OTHER_TRANSLATION[normalizedValue]
  if (otherTranslation) {
    return {
      translation: otherTranslation,
      category: 'other',
    }
  }

  return {
    translation: null,
    category,
  }
}

function translateTagCategory(category: string, locale: keyof Multilingual): string {
  const translation = TAG_CATEGORY_TRANSLATION[category]
  return translation?.[locale] || translation?.en || category
}
