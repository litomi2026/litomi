import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'

export const APPLICATION_NAME = '리토미 - 만화 웹 뷰어'
export const CANONICAL_URL = process.env.NODE_ENV === 'production' ? 'https://litomi.in' : 'http://localhost:3000'
export const SALT_ROUNDS = 12
export const SHORT_NAME = '리토미'
export const THEME_COLOR = '#0a0a0a'
export const TOTP_ISSUER = new URL(CANONICAL_URL).hostname
export const WEBAUTHN_ORIGIN = CANONICAL_URL
export const WEBAUTHN_RP_ID = new URL(CANONICAL_URL).hostname
export const WEBAUTHN_RP_NAME = 'litomi'

export const DESCRIPTION =
  '만화 웹 뷰어 - 히토미 대체 서비스로 E-Hentai 계열 만화, 동인지, 일러스트를 광고 없이 한 곳에서 감상하세요.'

export const defaultOpenGraph: OpenGraph = {
  title: APPLICATION_NAME,
  description: DESCRIPTION,
  url: CANONICAL_URL,
  siteName: SHORT_NAME,
  images: [{ url: '/og-image.png', alt: SHORT_NAME }],
  type: 'website',
  locale: 'ko_KR',
  alternateLocale: ['en_US', 'ja_JP'],
}

type Params = {
  title: string
  description?: string
  images?: string
  url?: string
}

export function generateOpenGraphMetadata({ title, description, images, url }: Params) {
  return {
    openGraph: {
      ...defaultOpenGraph,
      title: `${title} - ${SHORT_NAME}`,
      description,
      images,
      url,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@litomi_in',
      title: `${title} - ${SHORT_NAME}`,
      description,
      images,
    },
  }
}
