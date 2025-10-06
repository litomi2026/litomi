import { KOREAN_TO_ENGLISH_QUERY_KEYS } from '@/app/(navigation)/search/constants'
import { getAllArtistsWithLabels } from '@/translation/artist'
import { getAllCharactersWithLabels } from '@/translation/character'
import { getAllGroupsWithLabels } from '@/translation/group'
import { getAllLanguagesWithLabels, translateLanguage } from '@/translation/language'
import { getAllSeriesWithLabels } from '@/translation/series'
import tagCategoryTranslations from '@/translation/tag-category.json'
import tagMaleFemaleTranslations from '@/translation/tag-male-female.json'
import tagMixedTranslations from '@/translation/tag-mixed.json'
import tagOtherTranslations from '@/translation/tag-other.json'
import tagTranslations from '@/translation/tag.json'

import SuggestionTrie, { SuggestionItem } from './trie'

// Language and type options
const TYPE_OPTIONS = ['manga', 'doujinshi', 'artist_cg', 'game_cg', 'western', 'image_set', 'cosplay', 'asian_porn']

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
      ko: `${translations.ko}`,
      en: `${translations.en}`,
      ja: translations.ja ? `${translations.ja}` : undefined,
      'zh-CN': translations['zh-CN'] ? `${translations['zh-CN']}` : undefined,
      'zh-TW': translations['zh-TW'] ? `${translations['zh-TW']}` : undefined,
    }

    // Insert for both the category name and its translations
    suggestionTrie.insert(category, { value: categoryValue, labels })
    suggestionTrie.insert(categoryValue, { value: categoryValue, labels })
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
    labels: { ko: '언어', en: 'language' },
  })
  suggestionTrie.insert('언어', {
    value: 'language:',
    labels: { ko: '언어', en: 'language' },
  })

  getAllLanguagesWithLabels('ko').forEach(({ value, label: koLabel }) => {
    const enLabel = translateLanguage(value, 'en')
    const suggestion: SuggestionItem = {
      value: `language:${value}`,
      labels: {
        ko: `언어:${koLabel}`,
        en: `language:${enLabel}`,
      },
    }

    suggestionTrie.insert(`language:${value}`, suggestion)
    suggestionTrie.insert(value, suggestion)
    if (koLabel !== value) {
      suggestionTrie.insert(koLabel, suggestion)
    }
    if (enLabel !== value && enLabel !== koLabel) {
      suggestionTrie.insert(enLabel, suggestion)
    }
  })

  // Add type suggestions
  suggestionTrie.insert('type', {
    value: 'type:',
    labels: { ko: '종류', en: 'type' },
  })
  suggestionTrie.insert('종류', {
    value: 'type:',
    labels: { ko: '종류', en: 'type' },
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

  // Add series suggestions
  // First add the series category
  suggestionTrie.insert('series', {
    value: 'series:',
    labels: {
      ko: '시리즈',
      en: 'series',
      ja: 'シリーズ',
      'zh-CN': '系列',
      'zh-TW': '系列',
    },
  })
  suggestionTrie.insert('시리즈', {
    value: 'series:',
    labels: {
      ko: '시리즈',
      en: 'series',
      ja: 'シリーズ',
      'zh-CN': '系列',
      'zh-TW': '系列',
    },
  })

  // Add all series with their translations
  const allSeries = getAllSeriesWithLabels()
  allSeries.forEach((seriesItem) => {
    // Insert for the full value (e.g., "series:touhou_project")
    suggestionTrie.insert(seriesItem.value, seriesItem)

    // Extract the series key from "series:key"
    const seriesKey = seriesItem.value.replace(/^series:/, '')
    suggestionTrie.insert(seriesKey, seriesItem)

    // Insert for each translation
    Object.entries(seriesItem.labels).forEach(([_locale, label]) => {
      if (label) {
        // Extract just the series name from the label (e.g., "시리즈:동방 프로젝트" -> "동방 프로젝트")
        const seriesName = label.split(':')[1]
        if (seriesName) {
          suggestionTrie.insert(seriesName.toLowerCase(), seriesItem)
        }
      }
    })
  })

  // Add character suggestions
  // First add the character category
  suggestionTrie.insert('character', {
    value: 'character:',
    labels: {
      ko: '캐릭터',
      en: 'character',
      ja: 'キャラクター',
      'zh-CN': '角色',
      'zh-TW': '角色',
    },
  })
  suggestionTrie.insert('캐릭터', {
    value: 'character:',
    labels: {
      ko: '캐릭터',
      en: 'character',
      ja: 'キャラクター',
      'zh-CN': '角色',
      'zh-TW': '角色',
    },
  })

  // Add all characters with their translations
  const allCharacters = getAllCharactersWithLabels()
  allCharacters.forEach((characterItem) => {
    // Insert for the full value (e.g., "character:akira_kiyosumi")
    suggestionTrie.insert(characterItem.value, characterItem)

    // Extract the character key from "character:key"
    const characterKey = characterItem.value.replace('character:', '')
    suggestionTrie.insert(characterKey, characterItem)

    // Insert for each translation
    Object.entries(characterItem.labels).forEach(([_locale, label]) => {
      if (label) {
        // Extract just the character name from the label (e.g., "캐릭터:키요스미 아키라" -> "키요스미 아키라")
        const characterName = label.split(':')[1]
        if (characterName) {
          suggestionTrie.insert(characterName.toLowerCase(), characterItem)
        }
      }
    })
  })

  // Add artist suggestions
  // First add the artist category
  suggestionTrie.insert('artist', {
    value: 'artist:',
    labels: {
      ko: '작가',
      en: 'artist',
      ja: 'アーティスト',
      'zh-CN': '艺术家',
      'zh-TW': '藝術家',
    },
  })
  suggestionTrie.insert('작가', {
    value: 'artist:',
    labels: {
      ko: '작가',
      en: 'artist',
      ja: 'アーティスト',
      'zh-CN': '艺术家',
      'zh-TW': '藝術家',
    },
  })

  // Add all artists with their translations
  const allArtists = getAllArtistsWithLabels()
  allArtists.forEach((artistItem) => {
    // Insert for the full value (e.g., "artist:artist_name")
    suggestionTrie.insert(artistItem.value, artistItem)

    // Extract the artist key from "artist:key"
    const artistKey = artistItem.value.replace('artist:', '')
    suggestionTrie.insert(artistKey, artistItem)

    // Insert for each translation
    Object.entries(artistItem.labels).forEach(([_locale, label]) => {
      if (label) {
        // Extract just the artist name from the label (e.g., "작가:아티스트명" -> "아티스트명")
        const artistName = label.split(':')[1]
        if (artistName) {
          suggestionTrie.insert(artistName.toLowerCase(), artistItem)
        }
      }
    })
  })

  // Add group suggestions
  // First add the group category
  suggestionTrie.insert('group', {
    value: 'group:',
    labels: {
      ko: '그룹:',
      en: 'group:',
      ja: 'グループ:',
      'zh-CN': '团体:',
      'zh-TW': '團體:',
    },
  })
  suggestionTrie.insert('그룹', {
    value: 'group:',
    labels: {
      ko: '그룹:',
      en: 'group:',
      ja: 'グループ:',
      'zh-CN': '团体:',
      'zh-TW': '團體:',
    },
  })

  // Add all groups with their translations
  const allGroups = getAllGroupsWithLabels()
  allGroups.forEach((groupItem) => {
    // Insert for the full value (e.g., "group:group_name")
    suggestionTrie.insert(groupItem.value, groupItem)

    // Extract the group key from "group:key"
    const groupKey = groupItem.value.replace('group:', '')
    suggestionTrie.insert(groupKey, groupItem)

    // Insert for each translation
    Object.entries(groupItem.labels).forEach(([_locale, label]) => {
      if (label) {
        // Extract just the group name from the label (e.g., "그룹:그룹명" -> "그룹명")
        const groupName = label.split(':')[1]
        if (groupName) {
          suggestionTrie.insert(groupName.toLowerCase(), groupItem)
        }
      }
    })
  })
})()
