export enum Locale {
  KO = 'ko',
  EN = 'en',
  JA = 'ja',
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
}

export type Multilingual = {
  en: string
  ko?: string
  ja?: string
  'zh-CN'?: string
  'zh-TW'?: string
}

export type MultilingualMultiLabels = {
  en: string | string[]
  ko?: string | string[]
  ja?: string | string[]
  'zh-CN'?: string | string[]
  'zh-TW'?: string | string[]
}

export function normalizeValue(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_')
}

export function translateValue(
  dict: Record<string, Multilingual>,
  normalizedValue: string,
  locale: keyof Multilingual,
) {
  const translation = dict[normalizedValue]

  if (!translation) {
    return normalizedValue.replace(/_/g, ' ')
  }

  return translation[locale] || translation.en || normalizedValue.replace(/_/g, ' ')
}
