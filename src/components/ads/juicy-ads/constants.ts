export const AD_SLOTS = {
  DETAIL_PAGE: {
    id: 'detail-page-ad',
    zoneId: 1106853,
    width: 300,
    height: 250,
  },
  REWARDED_WIDE: {
    id: 'rewarded-ad-wide',
    zoneId: 1109437,
    width: 632,
    height: 190,
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

export const JUICY_ADS_EVENT = {
  LOADED: 'juicy-ads:loaded',
  ERROR: 'juicy-ads:error',
} as const
