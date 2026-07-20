import { APP_METADATA } from '@litomi/domain/app/metadata'
import { LOCALE_LANGUAGE_TAGS, type PublicLocale } from '@litomi/domain/locale'
import { env } from '@litomi/env/client'
import type { Graph } from 'schema-dts'

const ORIGIN = env.NEXT_PUBLIC_APP_ORIGIN
const ORGANIZATION_ID = `${ORIGIN}/#organization`
const WEBSITE_ID = `${ORIGIN}/#website`

// Site-wide Organization + WebSite graph, emitted once from the root layout so
// every page carries the brand entity that page-level nodes reference by @id.
function siteGraph(locale: PublicLocale): Graph {
  const { shortName } = APP_METADATA[locale]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: shortName,
        url: ORIGIN,
        logo: `${ORIGIN}/web-app-manifest-512x512.png`,
        sameAs: ['https://x.com/litomi_cc'],
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: shortName,
        url: ORIGIN,
        inLanguage: LOCALE_LANGUAGE_TAGS[locale],
        publisher: { '@id': ORGANIZATION_ID },
      },
    ],
  }
}

export default function SiteJsonLd({ locale }: { locale: PublicLocale }) {
  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data; '<' is escaped to prevent XSS.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraph(locale)).replaceAll('<', '\\u003c') }}
      type="application/ld+json"
    />
  )
}
