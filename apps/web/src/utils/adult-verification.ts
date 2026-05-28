import { AdultVerificationStatus, type GETV1MeResponse } from '@litomi/contracts'

type AdultVerified<T> = Exclude<T, null | undefined> & {
  adultVerification: { status: typeof AdultVerificationStatus.ADULT }
}

type MeWithAdSettings = Pick<GETV1MeResponse, 'adultVerification' | 'settings'> | null | undefined
type MeWithAdultVerification = Pick<GETV1MeResponse, 'adultVerification'> | null | undefined

export function hasAdultAccess(me: MeWithAdultVerification): boolean {
  if (!me) {
    return false
  }

  return me.adultVerification.required !== true || isAdultVerified(me)
}

export function isAdultAccessBlocked(me: MeWithAdultVerification): boolean {
  if (me === undefined) {
    return false
  }

  if (me === null) {
    return true
  }

  return me.adultVerification.required === true && !isAdultVerified(me)
}

export function isAdultVerified<T extends MeWithAdultVerification>(me: T): me is AdultVerified<T> {
  return me?.adultVerification.status === AdultVerificationStatus.ADULT
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
