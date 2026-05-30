import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { routing, SupportedLocale } from './routing'

export async function getLocaleFromParams(params: Promise<{ locale: string }>): Promise<SupportedLocale> {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  return locale
}
