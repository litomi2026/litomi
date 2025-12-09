import ms from 'ms'

export const JUICY_ADS_SCRIPT_URL = 'https://poweredby.jads.co/js/jads.js'

export const AD_SLOTS = {
  DETAIL_PAGE: {
    id: 'detail-page-ad',
    zoneId: 1106853,
    width: 300,
    height: 250,
  },
  REWARDED: {
    id: 'rewarded-ad',
    zoneId: 1106872,
    width: 308,
    height: 286,
  },
  REWARDED_2: {
    id: 'rewarded-ad-2',
    zoneId: 1106853,
    width: 300,
    height: 250,
  },
} as const

export const AD_LOAD_DELAY_MS = 100
export const AD_BLOCK_CHECK_DELAY_MS = ms('10 seconds')
