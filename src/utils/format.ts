type Locale = 'en' | 'ja' | 'ko' | 'zh-CN' | 'zh-TW'

const THOUSAND = 1000
const MILLION = 1000000
const TEN_THOUSAND = 10000
const HUNDRED_MILLION = 100000000

export function formatNumber(num: number, locale: Locale = 'ko'): string {
  if (num < THOUSAND) {
    return num.toString()
  }

  return locale === 'ko' ? formatKoreanNumberOptimized(num) : formatEnglishNumberOptimized(num)
}

const numberFormatters = {
  en: new Intl.NumberFormat('en-US'),
  ko: new Intl.NumberFormat('ko-KR'),
} as const

function formatEnglishNumberOptimized(num: number): string {
  if (num < MILLION) {
    const value = num / THOUSAND
    const isWholeNumber = num % THOUSAND === 0
    const formatted = isWholeNumber ? Math.floor(value) : Math.round(value * 10) / 10
    return numberFormatters.en.format(formatted) + 'K'
  }

  const value = num / MILLION
  const isWholeNumber = num % MILLION === 0
  const formatted = isWholeNumber ? Math.floor(value) : Math.round(value * 10) / 10
  return numberFormatters.en.format(formatted) + 'M'
}

function formatKoreanNumberOptimized(num: number): string {
  if (num < TEN_THOUSAND) {
    return numberFormatters.ko.format(num)
  }

  if (num < HUNDRED_MILLION) {
    const value = num / TEN_THOUSAND
    const isWholeNumber = num % TEN_THOUSAND === 0
    const formatted = isWholeNumber ? Math.floor(value) : Math.round(value * 10) / 10
    return numberFormatters.ko.format(formatted) + '만'
  }

  const value = num / HUNDRED_MILLION
  const isWholeNumber = num % HUNDRED_MILLION === 0
  const formatted = isWholeNumber ? Math.floor(value) : Math.round(value * 10) / 10
  return numberFormatters.ko.format(formatted) + '억'
}
