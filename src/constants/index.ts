import { CANONICAL_URL } from './url'

export const APPLICATION_NAME = 'Litomi - Manga mirror'
export const SHORT_NAME = 'Litomi'

export const DESCRIPTION =
  'Read manga online for free without any ads. Fast loading and mobile friendly. Update daily with latest chapters.'

export const defaultOpenGraph = {
  title: APPLICATION_NAME,
  description: DESCRIPTION,
  url: CANONICAL_URL,
  siteName: SHORT_NAME,
  images: [{ url: '/image/og-image.png' }],
  type: 'website',
}

export const MANGA_PER_PAGE = 18
