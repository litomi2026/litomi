import { type GETV1MeResponse } from '@litomi/contracts'

export function hasAdultAccess(me: GETV1MeResponse | null | undefined): boolean {
  if (!me) {
    return false
  }

  return me.adultVerification.required === false || isAdultVerified(me)
}

export function isAdultVerified(me: GETV1MeResponse | null | undefined) {
  return me?.adultVerification.status === 'adult'
}

export function shouldShowAds(me: GETV1MeResponse | null | undefined): boolean {
  if (me === undefined) {
    return false
  }

  if (me === null) {
    return true
  }

  if (isAdultVerified(me)) {
    return me.settings.adultVerifiedAdVisible
  }

  return true
}
