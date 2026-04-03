import type { GETV1MeResponse } from '@/backend/api/v1/me/GET'
import type { UserSettings } from '@/utils/user-settings'

export enum AdultState {
  UNRESOLVED,
  NOT_LOGIN,
  NOT_REQUIRED,
  ADULT,
  UNVERIFIED,
  NOT_ADULT,
}

type MeWithAdultVerification = Pick<GETV1MeResponse, 'adultVerification'> | null | undefined

export function getAdultState(me: MeWithAdultVerification): AdultState {
  if (me === undefined) {
    return AdultState.UNRESOLVED
  }

  if (me === null) {
    return AdultState.NOT_LOGIN
  }

  if (me.adultVerification.required !== true) {
    return AdultState.NOT_REQUIRED
  }

  switch (me.adultVerification.status) {
    case 'adult':
      return AdultState.ADULT
    case 'not_adult':
      return AdultState.NOT_ADULT
    case 'unverified':
      return AdultState.UNVERIFIED
  }
}

export function hasAdultAccess(state: AdultState): boolean {
  return state === AdultState.NOT_REQUIRED || state === AdultState.ADULT
}

export function isAdultAccessBlocked(state: AdultState): boolean {
  return state === AdultState.NOT_ADULT || state === AdultState.UNVERIFIED || state === AdultState.NOT_LOGIN
}

export function requiresAds(state: AdultState, settings?: UserSettings | null) {
  return (
    (state === AdultState.ADULT && settings?.adultVerifiedAdVisible) ||
    state === AdultState.NOT_ADULT ||
    state === AdultState.UNVERIFIED ||
    // state === AdultState.NOT_LOGIN ||
    state === AdultState.NOT_REQUIRED
  )
}

export function requiresAdultVerification(state: AdultState): boolean {
  return state === AdultState.ADULT || state === AdultState.UNVERIFIED || state === AdultState.NOT_ADULT
}
