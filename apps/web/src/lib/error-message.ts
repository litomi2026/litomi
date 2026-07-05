import { genericProblemByStatus } from '@litomi/contracts'
import type { InvalidParam, ProblemDetails } from '@litomi/http/problem-details'
import { getProblemCode } from '@litomi/http/problem-details'

// useTranslations('Errors')가 반환하는 번역기의 구조적 서브셋. setCustomValidity 등 문자열이 필요한 곳에서
// 컴포넌트가 t를 받아 넘긴다(토스트는 lib/toast의 컴포넌트 사용). values는 수량 필드(too_small/too_big) ICU용.
export type ErrorsTranslator = {
  (key: string, values?: Record<string, number | string>): string
  has: (key: string) => boolean
}

/**
 * invalidParams[].code → 사용자 카피. field(필드 축) 우선, cross-axis 코드(login-id-conflict 등)는 problem(응답 축),
 * 그 외는 invalid-input 으로 fallback. 수량 코드는 field 카탈로그의 ICU 가 min/max 를 채운다.
 */
export function getInvalidParamMessage(t: ErrorsTranslator, param: InvalidParam): string {
  const fieldKey = `field.${param.code}`

  if (t.has(fieldKey)) {
    return t(fieldKey, {
      min: param.minimum ?? 0,
      max: param.maximum ?? 0,
    })
  }

  const problemKey = `problem.${param.code}`

  if (t.has(problemKey)) {
    return t(problemKey)
  }

  return t('problem.invalid-input')
}

/** 카탈로그에 등록된 코드의 카피만 반환 — 없으면 undefined(호출부가 자체 fallback 결합). */
export function getProblemCodeMessage(t: ErrorsTranslator, problem: ProblemDetails): string | undefined {
  const slug = getProblemCode(problem.type)

  if (!slug) {
    return undefined
  }

  const key = `problem.${slug}`
  return t.has(key) ? t(key) : undefined
}

/** 코드 카피 우선, 없으면 status 파생 generic slug 카피로 fallback. */
export function getProblemMessage(t: ErrorsTranslator, problem: ProblemDetails): string {
  return getProblemCodeMessage(t, problem) ?? t(`problem.${genericProblemByStatus(problem.status).slug}`)
}
