import 'server-only'
import type { Locale } from '@litomi/domain/locale'

import { MangaTag } from '@litomi/domain/manga/model'
import { normalizeValue } from '@litomi/domain/utils/normalize-value'

import { getPrimaryTranslation, type TranslationEntry } from './common'
import tagCategoryJSON from './tag-category.json'
import tagMixedJSON from './tag-mixed.json'
import tagOtherJSON from './tag-other.json'
import tagSingleSexJSON from './tag-single-sex.json'
import tagUnisexTranslations from './tag-unisex.json'

type TagTranslationEntry = TranslationEntry<string | string[]>

const TAG_CATEGORY_TRANSLATION = tagCategoryJSON as Record<string, TagTranslationEntry | undefined>
const TAG_MIXED_TRANSLATION = tagMixedJSON as Record<string, TagTranslationEntry | undefined>
const TAG_OTHER_TRANSLATION = tagOtherJSON as Record<string, TagTranslationEntry | undefined>
const TAG_SINGLE_SEX_TRANSLATION = tagSingleSexJSON as Record<string, TagTranslationEntry | undefined>
const TAG_UNISEX_TRANSLATION = tagUnisexTranslations as Record<string, TagTranslationEntry | undefined>

export function translateTag(categoryFallback: string, value: string, locale: Locale): MangaTag {
  const normalizedValue = normalizeValue(value)
  const { translation, category } = findTranslation(normalizedValue, categoryFallback)
  const translatedCategory = translateTagCategory(category, locale)

  const translatedValue = translation ? getPrimaryTranslation(translation, locale) || normalizedValue : normalizedValue

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
  translation: TagTranslationEntry | null
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

function translateTagCategory(category: string, locale: Locale): string {
  const translation = TAG_CATEGORY_TRANSLATION[category]
  return translation ? getPrimaryTranslation(translation, locale) || category : category
}
