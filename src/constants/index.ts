export const APPLICATION_NAME = '리토미 - Litomi'
export const SHORT_NAME = '리토미'
export const LOCAL_URL = 'http://localhost:3000'
export const CANONICAL_URL = process.env.NODE_ENV === 'production' ? 'https://litomi.in' : LOCAL_URL

export const DESCRIPTION =
  'Read manga online for free without any ads. Fast loading and mobile friendly. Update daily with latest chapters.'

export const defaultOpenGraph = {
  title: APPLICATION_NAME,
  description: DESCRIPTION,
  url: CANONICAL_URL,
  siteName: SHORT_NAME,
  images: [{ url: '/og-image.png' }],
  type: 'website',
}

export const SALT_ROUNDS = 12
export const ONE_HOUR = 3600
export const THIRTY_DAYS = 2592000
export const THEME_COLOR = '#0a0a0a'
