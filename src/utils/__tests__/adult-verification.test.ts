import { describe, expect, it } from 'bun:test'

import type { GETV1MeResponse } from '@/backend/api/v1/me'

import { canAccessAdultRestrictedAPIs } from '../adult-verification'

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
  describe('canAccessAdultRestrictedAPIs', () => {
    it('returns false when me is missing', () => {
      expect(canAccessAdultRestrictedAPIs(null)).toBe(false)
    })

    it('returns true when verification is not required', () => {
      expect(canAccessAdultRestrictedAPIs(createMe('unverified', false))).toBe(true)
    })

    it('returns true only for adult users when verification is required', () => {
      expect(canAccessAdultRestrictedAPIs(createMe('adult'))).toBe(true)
      expect(canAccessAdultRestrictedAPIs(createMe('not_adult'))).toBe(false)
      expect(canAccessAdultRestrictedAPIs(createMe('unverified'))).toBe(false)
    })
  })
})
