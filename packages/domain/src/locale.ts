export enum Locale {
  KO = 'ko',
  EN = 'en',
  JA = 'ja',
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
}

export const DEFAULT_LOCALE = Locale.KO

export const PUBLIC_LOCALES = [Locale.KO, Locale.EN] as const
export type PublicLocale = (typeof PUBLIC_LOCALES)[number]
export type PublicLocaleCode = `${PublicLocale}`

export const LOCALE_NATIVE_NAMES = {
  [Locale.KO]: '한국어',
  [Locale.EN]: 'English',
  [Locale.JA]: '日本語',
  [Locale.ZH_CN]: '简体中文',
  [Locale.ZH_TW]: '繁體中文',
} satisfies Record<Locale, string>

export const LOCALE_LANGUAGE_TAGS = {
  [Locale.KO]: 'ko-KR',
  [Locale.EN]: 'en-US',
  [Locale.JA]: 'ja-JP',
  [Locale.ZH_CN]: 'zh-CN',
  [Locale.ZH_TW]: 'zh-TW',
} satisfies Record<Locale, string>

export const LOCALE_OPEN_GRAPH_TAGS = {
  [Locale.KO]: 'ko_KR',
  [Locale.EN]: 'en_US',
  [Locale.JA]: 'ja_JP',
  [Locale.ZH_CN]: 'zh_CN',
  [Locale.ZH_TW]: 'zh_TW',
} satisfies Record<Locale, string>

export function isPublicLocale(value: string): value is PublicLocale {
  return PUBLIC_LOCALES.includes(value as PublicLocale)
}
