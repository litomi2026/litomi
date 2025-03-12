import { CANONICAL_URL } from './url'

export const SHORT_NAME = 'Litomi'

export const defaultOpenGraph = {
  title: SHORT_NAME,
  description: 'Manga mirror site',
  url: CANONICAL_URL,
  siteName: SHORT_NAME,
  images: [{ url: '/og-image.png' }],
  type: 'website',
}
