import { KOREAN_TO_ENGLISH_QUERY_KEYS } from '@/app/(navigation)/search/constants'
import { getAllArtistsWithLabels } from '@/translation/artist'
import { getAllCharactersWithLabels } from '@/translation/character'
import { Locale } from '@/translation/common'
import { getAllGroupsWithLabels } from '@/translation/group'
import { getAllLanguagesWithLabels, translateLanguage } from '@/translation/language'
import { getAllSeriesWithLabels } from '@/translation/series'
import tagCategoryTranslations from '@/translation/tag-category.json'
import tagMixedTranslations from '@/translation/tag-mixed.json'
import tagOtherTranslations from '@/translation/tag-other.json'
import tagSingleSexTranslations from '@/translation/tag-single-sex.json'
import tagUnisexTranslations from '@/translation/tag-unisex.json'
import { getAllTypesWithLabels } from '@/translation/type'
import 'server-only'

import SuggestionTrie, { SuggestionItem } from './trie'

export const suggestionTrie = new SuggestionTrie()

type Translation = {
  en?: string | string[]
  ko?: string | string[]
  ja?: string | string[]
  'zh-CN'?: string | string[]
  'zh-TW'?: string | string[]
}

function getFirstTranslation<T>(translations: T): T extends string[] ? T[number] : T {
  return (Array.isArray(translations) ? translations[0] : translations) as T extends string[] ? T[number] : T
}

function getLabels(key: string, translations: Record<string, Translation>, category: string): SuggestionItem['labels'] {
  const categoryTranslation = tagCategoryTranslations[category as keyof typeof tagCategoryTranslations] || {}
  const tagTranslation = translations[key] || {}

  const getLabel = (locale: Locale) => {
    const tagLabel = getFirstTranslation(tagTranslation[locale])
    return `${categoryTranslation[locale] || category}:${tagLabel || key}`
  }

  return {
    ko: getLabel(Locale.KO),
    en: getLabel(Locale.EN),
    ja: getLabel(Locale.JA),
    'zh-CN': getLabel(Locale.ZH_CN),
    'zh-TW': getLabel(Locale.ZH_TW),
  }
}

function insertTranslationWords(trie: SuggestionTrie, translatedText: string, suggestion: SuggestionItem) {
  trie.insert(translatedText.toLowerCase(), suggestion)
  const words = translatedText.split(/[\s\u3000・]+/) // space, full-width space, middle dot

  for (const word of words) {
    const trimmedWord = word.trim()
    if (trimmedWord && trimmedWord.length > 2) {
      trie.insert(trimmedWord.toLowerCase(), suggestion)
    }
  }
}

function insertWithWordVariants(trie: SuggestionTrie, key: string, suggestion: SuggestionItem) {
  trie.insert(key, suggestion)

  if (key.includes('_')) {
    const parts = key.split('_')
    for (let i = 1; i < parts.length; i++) {
      const word = parts[i]
      if (word && word.length > 2) {
        trie.insert(word, suggestion)
      }
    }
  }
}

function processTranslation(
  trie: SuggestionTrie,
  translation: string | string[],
  originalTag: string,
  suggestion: SuggestionItem,
) {
  const translations = Array.isArray(translation) ? translation : [translation]

  for (const text of translations) {
    if (text && text !== originalTag) {
      insertTranslationWords(trie, text, suggestion)
    }
  }
}

;(() => {
  for (const [category, translations] of Object.entries(tagCategoryTranslations)) {
    const categoryValue = `${category}:`

    const labels: SuggestionItem['labels'] = {
      ko: translations.ko,
      en: translations.en,
      ja: translations.ja,
      'zh-CN': translations['zh-CN'],
      'zh-TW': translations['zh-TW'],
    }

    suggestionTrie.insert(category, { value: categoryValue, labels })
    suggestionTrie.insert(categoryValue, { value: categoryValue, labels })

    for (const translation of Object.values(translations)) {
      if (typeof translation === 'string') {
        suggestionTrie.insert(translation.toLowerCase(), { value: categoryValue, labels })
      }
    }

    // Also insert Korean shortcuts
    for (const [korean, english] of Object.entries(KOREAN_TO_ENGLISH_QUERY_KEYS)) {
      if (english === category) {
        suggestionTrie.insert(korean, { value: categoryValue, labels })
      }
    }
  }

  // Add language suggestions
  suggestionTrie.insert('language', {
    value: 'language:',
    labels: {
      ko: '언어',
      en: 'language',
      ja: '言語',
      'zh-CN': '语言',
      'zh-TW': '語言',
    },
  })
  suggestionTrie.insert('언어', {
    value: 'language:',
    labels: {
      ko: '언어',
      en: 'language',
      ja: '言語',
      'zh-CN': '语言',
      'zh-TW': '語言',
    },
  })

  // Add uploader suggestions
  suggestionTrie.insert('uploader', {
    value: 'uploader:',
    labels: {
      ko: '업로더',
      en: 'uploader',
      ja: 'アップローダー',
      'zh-CN': '上传者',
      'zh-TW': '上傳者',
    },
  })
  suggestionTrie.insert('업로더', {
    value: 'uploader:',
    labels: {
      ko: '업로더',
      en: 'uploader',
      ja: 'アップローダー',
      'zh-CN': '上传者',
      'zh-TW': '上傳者',
    },
  })

  for (const { value, label } of getAllLanguagesWithLabels('ko')) {
    const koLabel = getFirstTranslation(label)
    const enLabel = getFirstTranslation(translateLanguage(value, 'en'))
    const jaLabel = getFirstTranslation(translateLanguage(value, 'ja'))
    const zhCNLabel = getFirstTranslation(translateLanguage(value, 'zh-CN'))
    const zhTWLabel = getFirstTranslation(translateLanguage(value, 'zh-TW'))

    const suggestion: SuggestionItem = {
      value: `language:${value}`,
      labels: {
        ko: `언어:${koLabel}`,
        en: `language:${enLabel}`,
        ja: `言語:${jaLabel}`,
        'zh-CN': `语言:${zhCNLabel}`,
        'zh-TW': `語言:${zhTWLabel}`,
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
  }

  // Add type suggestions
  suggestionTrie.insert('type', {
    value: 'type:',
    labels: {
      ko: '종류',
      en: 'type',
      ja: 'タイプ',
      'zh-CN': '类型',
      'zh-TW': '類型',
    },
  })
  suggestionTrie.insert('종류', {
    value: 'type:',
    labels: {
      ko: '종류',
      en: 'type',
      ja: 'タイプ',
      'zh-CN': '类型',
      'zh-TW': '類型',
    },
  })

  // Add all types with their translations
  for (const typeItem of getAllTypesWithLabels()) {
    // Insert for the full value (e.g., "type:manga")
    suggestionTrie.insert(typeItem.value, typeItem)

    // Extract the type key from "type:key"
    const typeKey = typeItem.value.replace(/^type:/, '')
    suggestionTrie.insert(typeKey, typeItem)

    // Insert for each translation
    for (const label of Object.values(typeItem.labels)) {
      if (label) {
        // Extract just the type name from the label (e.g., "종류:망가" -> "망가")
        const typeName = label.split(':')[1]
        if (typeName) {
          suggestionTrie.insert(typeName.toLowerCase(), typeItem)
        }
      }
    }
  }

  // Add male/female tags
  for (const [tag, translations] of Object.entries(tagUnisexTranslations)) {
    for (const category of ['female', 'male']) {
      const value = `${category}:${tag}`
      const labels = getLabels(tag, { [tag]: translations }, category)
      suggestionTrie.insert(value, { value, labels })
      insertWithWordVariants(suggestionTrie, tag, { value, labels })

      for (const translation of Object.values(translations)) {
        processTranslation(suggestionTrie, translation, tag, { value, labels })
      }
    }
  }

  // Add mixed tags
  for (const [tag, translations] of Object.entries(tagMixedTranslations)) {
    const value = `mixed:${tag}`
    const labels = getLabels(tag, { [tag]: translations }, 'mixed')
    suggestionTrie.insert(value, { value, labels })
    insertWithWordVariants(suggestionTrie, tag, { value, labels })

    for (const translation of Object.values(translations)) {
      processTranslation(suggestionTrie, translation, tag, { value, labels })
    }
  }

  // Add other tags
  for (const [tag, translations] of Object.entries(tagOtherTranslations)) {
    const value = `other:${tag}`
    const labels = getLabels(tag, { [tag]: translations }, 'other')
    suggestionTrie.insert(value, { value, labels })
    insertWithWordVariants(suggestionTrie, tag, { value, labels })

    for (const translation of Object.values(translations)) {
      processTranslation(suggestionTrie, translation, tag, { value, labels })
    }
  }

  // Add special tag translations
  for (const [fullTag, translations] of Object.entries(tagSingleSexTranslations)) {
    const [category, tag] = fullTag.includes(':') ? fullTag.split(':') : ['', fullTag]

    if (category && tag) {
      const labels = getLabels(tag, { [tag]: translations }, category)
      suggestionTrie.insert(fullTag, { value: fullTag, labels })
      insertWithWordVariants(suggestionTrie, tag, { value: fullTag, labels })

      for (const translation of Object.values(translations)) {
        processTranslation(suggestionTrie, translation, tag, { value: fullTag, labels })
      }
    }
  }

  // Add series suggestions
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
  for (const seriesItem of getAllSeriesWithLabels()) {
    suggestionTrie.insert(seriesItem.value, seriesItem)
    const seriesKey = seriesItem.value.replace(/^series:/, '')
    insertWithWordVariants(suggestionTrie, seriesKey, seriesItem)

    for (const label of Object.values(seriesItem.labels)) {
      if (label) {
        // Extract just the series name from the label (e.g., "시리즈:동방 프로젝트" -> "동방 프로젝트")
        const seriesName = label.split(':')[1]
        if (seriesName) {
          insertTranslationWords(suggestionTrie, seriesName, seriesItem)
        }
      }
    }
  }

  // Add character suggestions
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
  for (const characterItem of getAllCharactersWithLabels()) {
    suggestionTrie.insert(characterItem.value, characterItem)
    const characterKey = characterItem.value.replace(/^character:/, '')
    insertWithWordVariants(suggestionTrie, characterKey, characterItem)

    for (const label of Object.values(characterItem.labels)) {
      if (label) {
        // Extract just the character name from the label (e.g., "캐릭터:키요스미 아키라" -> "키요스미 아키라")
        const characterName = label.split(':')[1]
        if (characterName) {
          insertTranslationWords(suggestionTrie, characterName, characterItem)
        }
      }
    }
  }

  // Add artist suggestions
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
  for (const artistItem of getAllArtistsWithLabels()) {
    suggestionTrie.insert(artistItem.value, artistItem)
    const artistKey = artistItem.value.replace(/^artist:/, '')
    insertWithWordVariants(suggestionTrie, artistKey, artistItem)

    for (const label of Object.values(artistItem.labels)) {
      if (label) {
        // Extract just the artist name from the label (e.g., "작가:아티스트명" -> "아티스트명")
        const artistName = label.split(':')[1]
        if (artistName) {
          insertTranslationWords(suggestionTrie, artistName, artistItem)
        }
      }
    }
  }

  // Add group suggestions
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
  for (const groupItem of getAllGroupsWithLabels()) {
    suggestionTrie.insert(groupItem.value, groupItem)
    const groupKey = groupItem.value.replace(/^group:/, '')
    insertWithWordVariants(suggestionTrie, groupKey, groupItem)

    for (const label of Object.values(groupItem.labels)) {
      if (label) {
        // Extract just the group name from the label (e.g., "그룹:그룹명" -> "그룹명")
        const groupName = label.split(':')[1]
        if (groupName) {
          insertTranslationWords(suggestionTrie, groupName, groupItem)
        }
      }
    }
  }
})()
