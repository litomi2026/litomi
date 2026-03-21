export const AD_SLOTS = {
  BANNER_300X250: {
    id: 'rewarded-ad-2',
    zoneId: 1106853,
    width: 300,
    height: 250,
  },
  BANNER_308X286: {
    id: 'rewarded-ad',
    zoneId: 1106872,
    width: 308,
    height: 286,
  },
  BANNER_300X100: {
    id: 'rewarded-ad-300x100',
    zoneId: 1106873,
    width: 300,
    height: 100,
  },
  BANNER_300X100_2: {
    id: 'rewarded-ad-300x100-2',
    zoneId: 1109444,
    width: 300,
    height: 100,
  },
  BANNER_308X286_2: {
    id: 'rewarded-ad-308x286-2',
    zoneId: 1113137,
    width: 308,
    height: 286,
  },
  BANNER_300X100_3: {
    id: 'banner-300x100-3',
    zoneId: 1113138,
    width: 300,
    height: 100,
  },
} as const

export const JUICY_ADS_EVENT = {
  LOADED: 'juicy-ads:loaded',
  ERROR: 'juicy-ads:error',
} as const

const JUICY_ADS_SLOT_ATTRIBUTE = 'data-juicy-ads-slot'

export const JUICY_ADS_BANNER_ID = 'juicy-ads-banner'
export const JUICY_ADS_SLOT_SELECTOR = `[${JUICY_ADS_SLOT_ATTRIBUTE}]`
export const JUICY_ADS_SLOT_PROPS = { [JUICY_ADS_SLOT_ATTRIBUTE]: '' }
