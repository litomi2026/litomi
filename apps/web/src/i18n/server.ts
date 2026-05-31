import type { PublicLocale } from '@litomi/domain/locale'

import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { routing } from './routing'

export async function getLocaleFromParams(params: Promise<{ locale: string }>): Promise<PublicLocale> {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  return locale
}
