import { APP_METADATA } from '@litomi/domain/app/metadata'
import { DEFAULT_LOCALE, LOCALE_OPEN_GRAPH_TAGS, PUBLIC_LOCALES, type PublicLocale } from '@litomi/domain/locale'
import type { Twitter } from 'next/dist/lib/metadata/types/twitter-types'

import { getPathname } from '@/i18n/navigation'

type Params = {
  title?: string
  description?: string
  images?: Twitter['images']
  pathname: string
  locale: PublicLocale
}

export function generateLocalizedMetadata({ pathname, locale, title, description, images }: Params) {
  const canonical = getPathname({ href: pathname, locale })
  const { applicationName, description: defaultDescription, shortName } = APP_METADATA[locale]
  const openGraphLocale = LOCALE_OPEN_GRAPH_TAGS[locale]

  const socialMetadata = {
    title: title ? `${title} - ${shortName}` : applicationName,
    description: description ?? defaultDescription,
    images: images ?? [{ url: '/og-image.webp', alt: shortName }],
  }

  return {
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(PUBLIC_LOCALES.map((locale) => [locale, getPathname({ href: pathname, locale })])),
        'x-default': getPathname({ href: pathname, locale: DEFAULT_LOCALE }),
      },
    },
    openGraph: {
      ...socialMetadata,
      locale: openGraphLocale,
      alternateLocale: PUBLIC_LOCALES.map((locale) => LOCALE_OPEN_GRAPH_TAGS[locale]).filter(
        (locale) => locale !== openGraphLocale,
      ),
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
