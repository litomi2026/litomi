import type { GETV1MeResponse } from '@/backend/api/v1/me'

export function canAccessAdultRestrictedAPIs(me: GETV1MeResponse | null | undefined): boolean {
  if (!me) {
    return false
  }

  const required = me.adultVerification?.required === true
  if (!required) {
    return true
  }

  return me.adultVerification?.status === 'adult'
}

export function isAdultVerificationBlocked(me: GETV1MeResponse | null | undefined): boolean {
  if (!me) {
    return false
  }

  return me.adultVerification?.required === true && me.adultVerification?.status !== 'adult'
}


