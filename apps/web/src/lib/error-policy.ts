import { PROBLEM, type ProblemSlug } from '@litomi/contracts'
import { getProblemCode } from '@litomi/http/problem-details'

// 특정 problem 코드의 전용 토스트 표현을 선언적으로 매핑한다. 여기에 없는 코드는
// status 기반 기본 토스트(5xx=error, 4xx=warning)로 처리된다 — 새 전용 토스트는 이 맵에 한 줄만 추가한다.
export type ErrorToastKind = 'adultOrLogin' | 'authRequired' | 'liboExpansion'

const ERROR_TOAST_POLICY: Partial<Record<ProblemSlug, ErrorToastKind>> = {
  [PROBLEM.ADULT_VERIFICATION_REQUIRED.slug]: 'adultOrLogin',
  [PROBLEM.AUTHENTICATION_REQUIRED.slug]: 'authRequired',
  [PROBLEM.LIBO_EXPANSION_REQUIRED.slug]: 'liboExpansion',
}

export function getErrorToastKind(typeUrl: string): ErrorToastKind | undefined {
  const slug = getProblemCode(typeUrl)
  return slug ? ERROR_TOAST_POLICY[slug as ProblemSlug] : undefined
}
