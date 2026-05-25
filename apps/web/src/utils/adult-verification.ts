import type { GETV1MeResponse } from '@litomi/contracts'

type MeWithAdSettings = Pick<GETV1MeResponse, 'adultVerification' | 'settings'> | null | undefined
type MeWithAdultVerification = Pick<GETV1MeResponse, 'adultVerification'> | null | undefined

export function hasAdultAccess(me: MeWithAdultVerification): boolean {
  return Boolean(me && (me.adultVerification.required !== true || isAdultVerified(me)))
}

export function isAdultAccessBlocked(me: MeWithAdultVerification): boolean {
  return me === null || Boolean(me && me.adultVerification.required === true && !isAdultVerified(me))
}

export function isAdultVerified(me: MeWithAdultVerification): boolean {
  return me?.adultVerification.status === 'adult'
}

export function shouldShowNonAdultAds(me: MeWithAdSettings): boolean {
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
