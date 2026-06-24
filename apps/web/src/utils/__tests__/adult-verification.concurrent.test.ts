import { describe, expect, it } from 'bun:test'
import type { GETV1MeResponse } from '@litomi/contracts'

import { hasAdultAccess, isAdultAccessBlocked, isAdultVerified, shouldShowNonAdultAds } from '../adult-verification'

function createMe(
  status: GETV1MeResponse['adultVerification']['status'],
  required = true,
  adultVerifiedAdVisible = false,
): GETV1MeResponse {
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
      adultVerifiedAdVisible,
      defaultCensorshipEnabled: true,
      autoDeletionDay: 180,
    },
  }
}

describe('성인 인증 유틸', () => {
  describe('isAdultVerified', () => {
    it('성인 인증 완료 여부를 status만으로 판단한다', () => {
      expect(isAdultVerified(undefined)).toBe(false)
      expect(isAdultVerified(null)).toBe(false)
      expect(isAdultVerified(createMe('adult'))).toBe(true)
      expect(isAdultVerified(createMe('unverified'))).toBe(false)
      expect(isAdultVerified(createMe('not-adult'))).toBe(false)
    })
  })

  describe('hasAdultAccess', () => {
    it('로그인했고 성인 게이트가 없거나 성인 인증이 완료된 경우 true를 반환한다', () => {
      expect(hasAdultAccess(undefined)).toBe(false)
      expect(hasAdultAccess(null)).toBe(false)
      expect(hasAdultAccess(createMe('unverified', false))).toBe(true)
      expect(hasAdultAccess(createMe('adult'))).toBe(true)
      expect(hasAdultAccess(createMe('unverified'))).toBe(false)
      expect(hasAdultAccess(createMe('not-adult'))).toBe(false)
    })
  })

  describe('isAdultAccessBlocked', () => {
    it('비로그인 또는 성인 게이트에서 통과하지 못한 경우 true를 반환한다', () => {
      expect(isAdultAccessBlocked(undefined)).toBe(false)
      expect(isAdultAccessBlocked(null)).toBe(true)
      expect(isAdultAccessBlocked(createMe('unverified', false))).toBe(false)
      expect(isAdultAccessBlocked(createMe('adult'))).toBe(false)
      expect(isAdultAccessBlocked(createMe('unverified'))).toBe(true)
      expect(isAdultAccessBlocked(createMe('not-adult'))).toBe(true)
    })
  })

  describe('shouldShowNonAdultAds', () => {
    it('성인 인증 완료 전에는 로그인 여부와 무관하게 광고가 필요하다', () => {
      expect(shouldShowNonAdultAds(undefined)).toBe(false)
      expect(shouldShowNonAdultAds(null)).toBe(true)
      expect(shouldShowNonAdultAds(createMe('unverified'))).toBe(true)
      expect(shouldShowNonAdultAds(createMe('not-adult'))).toBe(true)
      expect(shouldShowNonAdultAds(createMe('unverified', false))).toBe(true)
    })

    it('성인 인증 완료 후에는 사용자 설정에 따라 광고를 표시한다', () => {
      expect(shouldShowNonAdultAds(createMe('adult'))).toBe(false)
      expect(shouldShowNonAdultAds(createMe('adult', true, true))).toBe(true)
      expect(shouldShowNonAdultAds(createMe('adult', false))).toBe(false)
    })
  })
})
