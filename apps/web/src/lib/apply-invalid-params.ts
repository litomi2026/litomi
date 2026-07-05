import type { ProblemDetails } from '@litomi/http/problem-details'

import { getInvalidParams } from '@litomi/http/problem-details'

import type { ErrorsTranslator } from '@/lib/error-message'

import { getInvalidParamMessage } from '@/lib/error-message'

/**
 * problem.invalidParams 를 폼 입력에 매핑해 setCustomValidity + 첫 필드 focus/reportValidity 한다.
 * fieldMap: 서버 필드명(invalidParams[].name) → 폼 input name. 매핑에 없는 필드는 무시한다.
 * 반환: 하나라도 표시했으면 true(호출부가 자체 fallback 여부 판단).
 */
export function applyInvalidParams(
  form: HTMLFormElement | null,
  problem: ProblemDetails,
  t: ErrorsTranslator,
  fieldMap: Record<string, string>,
): boolean {
  let firstInvalidInput: HTMLInputElement | null = null

  for (const param of getInvalidParams(problem)) {
    const inputName = fieldMap[param.name]

    if (!inputName) {
      continue
    }

    const input = form?.elements.namedItem(inputName)

    if (!(input instanceof HTMLInputElement)) {
      continue
    }

    input.setCustomValidity(getInvalidParamMessage(t, param))
    firstInvalidInput ??= input
  }

  if (!firstInvalidInput) {
    return false
  }

  firstInvalidInput.focus()
  firstInvalidInput.reportValidity()
  return true
}
