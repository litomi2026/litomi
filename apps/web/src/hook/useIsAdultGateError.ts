'use client'

import { AdultVerificationStatus, type GETV1MeResponse } from '@litomi/contracts'

import useMeQuery from '@/query/useMeQuery'
import { isAdultVerificationRequiredError } from '@/utils/adult-verification-error'
import { OpaqueOriginError } from '@/utils/fetch-response'

// 프록시(cross-origin)에서는 성인 WAF 403 차단과 원인 불명 실패(예: 오리진 530)가 모두 opaque TypeError로 관측돼
// 응답만으로 구분할 수 없다. 성인 접근권이 없어 WAF에 막힐 수 있는 사용자만 성인 게이트로 안내하고,
// 이미 성인 인증을 마쳤거나 인증이 불필요한 사용자에게는 일반 오류로 처리한다.
export default function useIsAdultGateError(error: unknown): boolean {
  const { data: me } = useMeQuery()

  if (isAdultVerificationRequiredError(error)) {
    return true
  }

  return error instanceof OpaqueOriginError && lacksAdultAccess(me)
}

function lacksAdultAccess(me: GETV1MeResponse | null | undefined): boolean {
  if (!me) {
    return true
  }

  return me.adultVerification.required && me.adultVerification.status !== AdultVerificationStatus.ADULT
}
