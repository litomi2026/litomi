import { PROBLEM } from '@litomi/contracts'
import { isProblemType } from '@litomi/http/problem-details'

import { HTTPResponseError, ProblemDetailsError } from '@/utils/fetch-response'

export function isAdultVerificationRequiredError(error: unknown): boolean {
  if (error instanceof HTTPResponseError && error.status === 403) {
    return true
  }

  return (
    error instanceof ProblemDetailsError &&
    error.status === 403 &&
    isProblemType(error.type, PROBLEM.ADULT_VERIFICATION_REQUIRED.slug)
  )
}
