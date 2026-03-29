import { describe, expect, it } from 'bun:test'

import type { GETV1MeResponse } from '@/backend/api/v1/me'

import { AdultState, getAdultState, hasAdultAccess, requiresAdultVerification } from '../adult-verification'

function createMe(status: GETV1MeResponse['adultVerification']['status'], required = true): GETV1MeResponse {
  return {
    id: 1,
    loginId: 'tester',
    name: 'tester',
    nickname: '테스터',
    imageURL: null,
    adultVerification: {
      required,
      status,
    },
  }
}

describe('adult verification utils', () => {
  describe('getAdultAccessState', () => {
    it('returns unresolved when me is undefined', () => {
      expect(getAdultState(undefined)).toBe(AdultState.UNRESOLVED)
    })

    it('returns guest when me is null', () => {
      expect(getAdultState(null)).toBe(AdultState.NOT_LOGIN)
    })

    it('returns not_required when verification is not required', () => {
      expect(getAdultState(createMe('unverified', false))).toBe(AdultState.NOT_REQUIRED)
    })

    it('maps required verification statuses to explicit access states', () => {
      expect(getAdultState(createMe('adult'))).toBe(AdultState.ADULT)
      expect(getAdultState(createMe('unverified'))).toBe(AdultState.UNVERIFIED)
      expect(getAdultState(createMe('not_adult'))).toBe(AdultState.NOT_ADULT)
    })
  })

  describe('hasAdultAccess', () => {
    it('returns true only for allowed access states', () => {
      expect(hasAdultAccess(AdultState.UNRESOLVED)).toBe(false)
      expect(hasAdultAccess(AdultState.NOT_LOGIN)).toBe(false)
      expect(hasAdultAccess(AdultState.NOT_REQUIRED)).toBe(true)
      expect(hasAdultAccess(AdultState.ADULT)).toBe(true)
      expect(hasAdultAccess(AdultState.UNVERIFIED)).toBe(false)
      expect(hasAdultAccess(AdultState.NOT_ADULT)).toBe(false)
    })
  })

  describe('requiresAdultVerification', () => {
    it('returns true only when adult verification is enforced for the user', () => {
      expect(requiresAdultVerification(AdultState.UNRESOLVED)).toBe(false)
      expect(requiresAdultVerification(AdultState.NOT_LOGIN)).toBe(false)
      expect(requiresAdultVerification(AdultState.NOT_REQUIRED)).toBe(false)
      expect(requiresAdultVerification(AdultState.ADULT)).toBe(true)
      expect(requiresAdultVerification(AdultState.UNVERIFIED)).toBe(true)
      expect(requiresAdultVerification(AdultState.NOT_ADULT)).toBe(true)
    })
  })
})
