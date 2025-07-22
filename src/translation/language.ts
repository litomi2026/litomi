import type { Multilingual } from './common'

import { normalizeValue } from './common'

const languageTranslations: Record<string, Multilingual> = {
  chinese: { en: 'Chinese', ko: '중국어', ja: '中国語' },
  english: { en: 'English', ko: '영어', ja: '英語' },
  french: { en: 'French', ko: '프랑스어', ja: 'フランス語' },
  german: { en: 'German', ko: '독일어', ja: 'ドイツ語' },
  indonesian: { en: 'Indonesian', ko: '인도네시아어', ja: 'インドネシア語' },
  italian: { en: 'Italian', ko: '이탈리아어', ja: 'イタリア語' },
  japanese: { en: 'Japanese', ko: '일본어', ja: '日本語' },
  korean: { en: 'Korean', ko: '한국어', ja: '韓国語' },
  portuguese: { en: 'Portuguese', ko: '포르투갈어', ja: 'ポルトガル語' },
  russian: { en: 'Russian', ko: '러시아어', ja: 'ロシア語' },
  spanish: { en: 'Spanish', ko: '스페인어', ja: 'スペイン語' },
  thai: { en: 'Thai', ko: '태국어', ja: 'タイ語' },
  vietnamese: { en: 'Vietnamese', ko: '베트남어', ja: 'ベトナム語' },
  'n/a': { en: 'N/A', ko: 'N/A', ja: 'N/A' },
  translated: { en: 'Translated', ko: '번역됨', ja: '翻訳' },
  rewrite: { en: 'Rewrite', ko: '재작성', ja: '書き換え' },
  speechless: { en: 'Speechless', ko: '무언어', ja: '無言' },
  text_cleaned: { en: 'Text Cleaned', ko: '글 지워짐', ja: 'テキストクリーン' },
}

export function getAllLanguagesWithLabels(locale: keyof Multilingual) {
  return Object.entries(languageTranslations).map(([value, translations]) => ({
    value,
    label: translations[locale] ?? value,
  }))
}

export function translateLanguage(value: string, locale: keyof Multilingual) {
  const normalized = normalizeValue(value)
  const translation = languageTranslations[normalized]
  return translation?.[locale] ?? value.replaceAll('_', ' ')
}

export function translateLanguageList(values: string[], locale: keyof Multilingual) {
  return values.map((value) => ({
    value: normalizeValue(value),
    label: translateLanguage(value, locale),
  }))
}
