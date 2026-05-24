import type { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'
import type { Twitter } from 'next/dist/lib/metadata/types/twitter-types'

import { APPLICATION_NAME, DESCRIPTION, SHORT_NAME } from '@litomi/domain/app/metadata'
import { env } from '@litomi/env/client'

export const defaultOpenGraph: OpenGraph = {
  title: APPLICATION_NAME,
  description: DESCRIPTION,
  url: env.NEXT_PUBLIC_APP_ORIGIN,
  siteName: SHORT_NAME,
  images: [{ url: '/og-image.webp', alt: SHORT_NAME }],
  type: 'website',
  locale: 'ko_KR',
  alternateLocale: ['en_US', 'ja_JP'],
}

type Params = {
  title?: string
  description?: string
  images?: Twitter['images']
  url?: string
}

export function generateOpenGraphMetadata({ title, description, images, url }: Params = {}) {
  const metadataOverrides = {
    title: title ? `${title} - ${SHORT_NAME}` : defaultOpenGraph.title,
    description: description || defaultOpenGraph.description,
  }

  return {
    openGraph: {
      ...defaultOpenGraph,
      ...metadataOverrides,
      images: images || defaultOpenGraph.images,
      ...(url && { url }),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@litomi_in',
      ...metadataOverrides,
      images: defaultOpenGraph.images,
    },
  }
}
