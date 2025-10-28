import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'
import { Twitter } from 'next/dist/lib/metadata/types/twitter-types'

import { NEXT_PUBLIC_CANONICAL_URL } from './env'

export const APPLICATION_NAME = '리토미 - 만화 웹 뷰어'
export const CANONICAL_URL = NEXT_PUBLIC_CANONICAL_URL
export const SALT_ROUNDS = 12
export const SHORT_NAME = '리토미'
export const THEME_COLOR = '#0a0a0a'
export const TOTP_ISSUER = new URL(CANONICAL_URL).hostname
export const WEBAUTHN_ORIGIN = CANONICAL_URL
export const WEBAUTHN_RP_ID = new URL(CANONICAL_URL).hostname
export const WEBAUTHN_RP_NAME = 'litomi'
export const COOKIE_DOMAIN = '.litomi.in'

export const DESCRIPTION =
  '만화 웹 뷰어 - 히토미 대체 서비스로 E-Hentai 계열 만화, 동인지, 일러스트를 광고 없이 한 곳에서 감상하세요.'

export const defaultOpenGraph: OpenGraph = {
  title: APPLICATION_NAME,
  description: DESCRIPTION,
  url: CANONICAL_URL,
  siteName: SHORT_NAME,
  images: [{ url: '/og-image.webp', alt: SHORT_NAME }], // TODO: 나중에 avif 파일로 바꾸기
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
    images: images || defaultOpenGraph.images,
  }

  return {
    openGraph: {
      ...defaultOpenGraph,
      ...metadataOverrides,
      ...(url && { url }),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@litomi_in',
      ...metadataOverrides,
    },
  }
}
