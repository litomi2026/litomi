import { CANONICAL_URL } from './url'

export const SHORT_NAME = 'Litomi'

export const DESCRIPTION = 'Manga mirror site - Read manga online for free without any ads'

export const defaultOpenGraph = {
  title: SHORT_NAME,
  description: DESCRIPTION,
  url: CANONICAL_URL,
  siteName: SHORT_NAME,
  images: [{ url: '/image/og-image.png' }],
  type: 'website',
}

export const MANGA_PER_PAGE = 18
