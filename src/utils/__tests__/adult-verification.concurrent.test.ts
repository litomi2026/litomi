import { describe, expect, it } from 'bun:test'

import type { GETV1MeResponse } from '@/backend/api/v1/me/GET'

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
    settings: {
      historySyncEnabled: true,
      adultVerifiedAdVisible: false,
      autoDeletionDay: 180,
    },
  }
}

describe('성인 인증 유틸', () => {
  describe('getAdultAccessState', () => {
    it('me가 undefined면 미해결 상태를 반환한다', () => {
      expect(getAdultState(undefined)).toBe(AdultState.UNRESOLVED)
    })

    it('me가 null이면 게스트 상태를 반환한다', () => {
      expect(getAdultState(null)).toBe(AdultState.NOT_LOGIN)
    })

    it('인증이 필요 없으면 not_required 상태를 반환한다', () => {
      expect(getAdultState(createMe('unverified', false))).toBe(AdultState.NOT_REQUIRED)
    })

    it('인증이 필요한 상태값을 명시적인 접근 상태로 매핑한다', () => {
      expect(getAdultState(createMe('adult'))).toBe(AdultState.ADULT)
      expect(getAdultState(createMe('unverified'))).toBe(AdultState.UNVERIFIED)
      expect(getAdultState(createMe('not_adult'))).toBe(AdultState.NOT_ADULT)
    })
  })

  describe('hasAdultAccess', () => {
    it('접근이 허용된 상태에서만 true를 반환한다', () => {
      expect(hasAdultAccess(AdultState.UNRESOLVED)).toBe(false)
      expect(hasAdultAccess(AdultState.NOT_LOGIN)).toBe(false)
      expect(hasAdultAccess(AdultState.NOT_REQUIRED)).toBe(true)
      expect(hasAdultAccess(AdultState.ADULT)).toBe(true)
      expect(hasAdultAccess(AdultState.UNVERIFIED)).toBe(false)
      expect(hasAdultAccess(AdultState.NOT_ADULT)).toBe(false)
    })
  })

  describe('requiresAdultVerification', () => {
    it('사용자에게 성인 인증이 강제될 때만 true를 반환한다', () => {
      expect(requiresAdultVerification(AdultState.UNRESOLVED)).toBe(false)
      expect(requiresAdultVerification(AdultState.NOT_LOGIN)).toBe(false)
      expect(requiresAdultVerification(AdultState.NOT_REQUIRED)).toBe(false)
      expect(requiresAdultVerification(AdultState.ADULT)).toBe(true)
      expect(requiresAdultVerification(AdultState.UNVERIFIED)).toBe(true)
      expect(requiresAdultVerification(AdultState.NOT_ADULT)).toBe(true)
    })
  })
})
