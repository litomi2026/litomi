import { KOREAN_TO_ENGLISH_QUERY_KEYS } from '@/app/(navigation)/search/constants'
import tagCategoryTranslations from '@/database/translation/tag-category.json'
import tagMaleFemaleTranslations from '@/database/translation/tag-male-female.json'
import tagMixedTranslations from '@/database/translation/tag-mixed.json'
import tagOtherTranslations from '@/database/translation/tag-other.json'
import tagTranslations from '@/database/translation/tag.json'

import SuggestionTrie, { SuggestionItem } from './trie'

// Language and type options
const LANGUAGE_OPTIONS = ['korean', 'english', 'japanese', 'chinese', 'n/a']
const TYPE_OPTIONS = ['manga', 'doujinshi', 'artist cg', 'game cg', 'western', 'image set', 'cosplay', 'asian porn']

// Initialize the Trie with all suggestions
export const suggestionTrie = new SuggestionTrie()

// Helper function to get label translations
function getLabels(
  key: string,
  translations: Record<string, { en?: string; ko?: string; ja?: string; 'zh-CN'?: string; 'zh-TW'?: string }>,
  category?: string,
): SuggestionItem['labels'] {
  const translation = translations[key] || {}

  // For categories
  if (!category) {
    return {
      ko: translation.ko || translation.en || key,
      en: translation.en || key,
      ja: translation.ja,
      'zh-CN': translation['zh-CN'],
      'zh-TW': translation['zh-TW'],
    }
  }

  // For tags with categories
  const categoryTranslation = tagCategoryTranslations[category as keyof typeof tagCategoryTranslations] || {}

  // Get the tag label, fallback to English name or the key itself
  const getTagLabel = (locale: string) => {
    if (locale === 'ko' && translation.ko) return translation.ko
    if (locale === 'en' && translation.en) return translation.en
    if (locale === 'ja' && translation.ja) return translation.ja
    if (locale === 'zh-CN' && translation['zh-CN']) return translation['zh-CN']
    if (locale === 'zh-TW' && translation['zh-TW']) return translation['zh-TW']

    // Fallback to English name or key, converted to uppercase for special cases like BDSM
    return translation.en || (key.includes('bdsm') ? key.toUpperCase() : key)
  }

  return {
    ko: `${categoryTranslation.ko || category}:${getTagLabel('ko')}`,
    en: `${categoryTranslation.en || category}:${getTagLabel('en')}`,
    ja: categoryTranslation.ja ? `${categoryTranslation.ja}:${getTagLabel('ja')}` : undefined,
    'zh-CN': categoryTranslation['zh-CN'] ? `${categoryTranslation['zh-CN']}:${getTagLabel('zh-CN')}` : undefined,
    'zh-TW': categoryTranslation['zh-TW'] ? `${categoryTranslation['zh-TW']}:${getTagLabel('zh-TW')}` : undefined,
  }
}

// Initialize suggestions on module load
;(() => {
  // Add category suggestions
  Object.entries(tagCategoryTranslations).forEach(([category, translations]) => {
    const categoryValue = `${category}:`
    const labels: SuggestionItem['labels'] = {
      ko: `${translations.ko}:`,
      en: `${translations.en}:`,
      ja: translations.ja ? `${translations.ja}:` : undefined,
      'zh-CN': translations['zh-CN'] ? `${translations['zh-CN']}:` : undefined,
      'zh-TW': translations['zh-TW'] ? `${translations['zh-TW']}:` : undefined,
    }

    // Insert for both the category name and its translations
    suggestionTrie.insert(category, { value: categoryValue, labels })
    suggestionTrie.insert(categoryValue, { value: categoryValue, labels }) // Also insert with colon
    Object.values(translations).forEach((translation) => {
      if (typeof translation === 'string') {
        suggestionTrie.insert(translation.toLowerCase(), { value: categoryValue, labels })
      }
    })

    // Also insert Korean shortcuts
    Object.entries(KOREAN_TO_ENGLISH_QUERY_KEYS).forEach(([korean, english]) => {
      if (english === category) {
        suggestionTrie.insert(korean, { value: categoryValue, labels })
      }
    })
  })

  // Add language suggestions
  suggestionTrie.insert('language', {
    value: 'language:',
    labels: { ko: '언어:', en: 'language:' },
  })
  suggestionTrie.insert('language:', {
    value: 'language:',
    labels: { ko: '언어:', en: 'language:' },
  })
  suggestionTrie.insert('언어', {
    value: 'language:',
    labels: { ko: '언어:', en: 'language:' },
  })

  LANGUAGE_OPTIONS.forEach((lang) => {
    const value = `language:${lang}`
    const koLabel =
      lang === 'korean'
        ? '한국어'
        : lang === 'japanese'
          ? '일본어'
          : lang === 'english'
            ? '영어'
            : lang === 'chinese'
              ? '중국어'
              : lang

    const suggestion: SuggestionItem = {
      value,
      labels: {
        ko: `언어:${koLabel}`,
        en: value,
      },
    }

    // Insert for full value
    suggestionTrie.insert(value, suggestion)
    // Insert for language name
    suggestionTrie.insert(lang, suggestion)
    // Insert for Korean name
    if (koLabel !== lang) {
      suggestionTrie.insert(koLabel, suggestion)
    }
  })

  // Add type suggestions
  suggestionTrie.insert('type', {
    value: 'type:',
    labels: { ko: '종류:', en: 'type:' },
  })
  suggestionTrie.insert('type:', {
    value: 'type:',
    labels: { ko: '종류:', en: 'type:' },
  })
  suggestionTrie.insert('종류', {
    value: 'type:',
    labels: { ko: '종류:', en: 'type:' },
  })

  TYPE_OPTIONS.forEach((type) => {
    const value = `type:${type}`
    const koLabel = type === 'manga' ? '망가' : type === 'doujinshi' ? '동인지' : type

    const suggestion: SuggestionItem = {
      value,
      labels: {
        ko: `종류:${koLabel}`,
        en: value,
      },
    }

    suggestionTrie.insert(value, suggestion)
    suggestionTrie.insert(type.replace(' ', '_'), suggestion)
    if (koLabel !== type) {
      suggestionTrie.insert(koLabel, suggestion)
    }
  })

  // Add male/female tags
  Object.entries(tagMaleFemaleTranslations).forEach(([tag, translations]) => {
    ;['female', 'male'].forEach((category) => {
      const value = `${category}:${tag}`
      const labels = getLabels(tag, { [tag]: translations }, category)

      // Insert full value
      suggestionTrie.insert(value, { value, labels })

      // Insert tag name for direct search
      suggestionTrie.insert(tag, { value, labels })

      // Insert translated names
      Object.values(translations).forEach((translation) => {
        if (typeof translation === 'string' && translation !== tag) {
          suggestionTrie.insert(translation.toLowerCase(), { value, labels })
        }
      })
    })
  })

  // Add mixed tags
  Object.entries(tagMixedTranslations).forEach(([tag, translations]) => {
    const value = `mixed:${tag}`
    const labels = getLabels(tag, { [tag]: translations }, 'mixed')

    suggestionTrie.insert(value, { value, labels })
    suggestionTrie.insert(tag, { value, labels })

    // For compound tags like "fff_threesome", also insert the suffix "threesome"
    if (tag.includes('_')) {
      const parts = tag.split('_')
      const suffix = parts[parts.length - 1]
      if (suffix && suffix.length > 3) {
        suggestionTrie.insert(suffix, { value, labels })
      }
    }

    Object.values(translations).forEach((translation) => {
      if (typeof translation === 'string' && translation !== tag) {
        suggestionTrie.insert(translation.toLowerCase(), { value, labels })
      }
    })
  })

  // Add other tags
  Object.entries(tagOtherTranslations).forEach(([tag, translations]) => {
    const value = `other:${tag}`
    const labels = getLabels(tag, { [tag]: translations }, 'other')

    suggestionTrie.insert(value, { value, labels })
    suggestionTrie.insert(tag, { value, labels })

    Object.values(translations).forEach((translation) => {
      if (typeof translation === 'string' && translation !== tag) {
        suggestionTrie.insert(translation.toLowerCase(), { value, labels })
      }
    })
  })

  // Add special tag translations
  Object.entries(tagTranslations).forEach(([fullTag, translations]) => {
    const [category, tag] = fullTag.includes(':') ? fullTag.split(':') : ['', fullTag]

    if (category && tag) {
      const labels = getLabels(tag, { [tag]: translations }, category)

      suggestionTrie.insert(fullTag, { value: fullTag, labels })
      suggestionTrie.insert(tag, { value: fullTag, labels })

      Object.values(translations).forEach((translation) => {
        if (typeof translation === 'string' && translation !== tag) {
          suggestionTrie.insert(translation.toLowerCase(), { value: fullTag, labels })
        }
      })
    }
  })
})()
