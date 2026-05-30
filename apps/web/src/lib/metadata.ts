import type { Twitter } from 'next/dist/lib/metadata/types/twitter-types'

import { APP_METADATA } from '@litomi/domain/app/metadata'

import { getPathname } from '@/i18n/navigation'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, SupportedLocale } from '@/i18n/routing'

const OPEN_GRAPH_LOCALE: Record<SupportedLocale, string> = {
  ko: 'ko_KR',
  en: 'en_US',
}

type Params = {
  title?: string
  description?: string
  images?: Twitter['images']
  pathname: string
  locale: SupportedLocale
}

export function generateLocalizedMetadata({ pathname, locale, title, description, images }: Params) {
  const canonical = getPathname({ href: pathname, locale })
  const { applicationName, description: defaultDescription, shortName } = APP_METADATA[locale]
  const openGraphLocale = OPEN_GRAPH_LOCALE[locale]

  const socialMetadata = {
    title: title ? `${title} - ${shortName}` : applicationName,
    description: description ?? defaultDescription,
    images: images ?? [{ url: '/og-image.webp', alt: shortName }],
  }

  return {
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, getPathname({ href: pathname, locale })])),
        'x-default': getPathname({ href: pathname, locale: DEFAULT_LOCALE }),
      },
    },
    openGraph: {
      ...socialMetadata,
      locale: openGraphLocale,
      alternateLocale: Object.values(OPEN_GRAPH_LOCALE).filter((locale) => locale !== openGraphLocale),
      siteName: shortName,
      type: 'website',
      url: canonical,
    },
    twitter: {
      ...socialMetadata,
      card: 'summary_large_image',
      site: '@litomi_in',
    },
  }
}
