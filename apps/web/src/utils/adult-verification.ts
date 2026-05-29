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
