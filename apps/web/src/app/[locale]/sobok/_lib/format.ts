import { LOCALE_LANGUAGE_TAGS, Locale, type PublicLocale } from '@litomi/domain/locale'

export function formatKRW(amount: number, locale: PublicLocale): string {
  if (locale === Locale.KO) {
    return `${amount.toLocaleString('ko-KR')}원`
  }

  return new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[locale], { style: 'currency', currency: 'KRW' }).format(amount)
}

export function formatPrice(price: { amount: number; currency: string }, locale: PublicLocale): string {
  if (price.currency === 'KRW') {
    return formatKRW(price.amount, locale)
  }

  return `${price.amount.toLocaleString(LOCALE_LANGUAGE_TAGS[locale])} ${price.currency}`
}

export function formatDate(date: Date, locale: PublicLocale): string {
  return date.toLocaleDateString(LOCALE_LANGUAGE_TAGS[locale], { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatTime(iso: string, locale: PublicLocale): string {
  return new Date(iso).toLocaleTimeString(LOCALE_LANGUAGE_TAGS[locale], { hour: '2-digit', minute: '2-digit' })
}
