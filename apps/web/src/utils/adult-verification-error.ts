import { isProblemType, problemCode } from '@litomi/http/problem-details'

import { HTTPResponseError, ProblemDetailsError } from '@/utils/fetch-response'

export function isAdultVerificationRequiredError(error: unknown): boolean {
  if (error instanceof HTTPResponseError) {
    return error.status === 403
  }

  return (
    error instanceof ProblemDetailsError &&
    error.status === 403 &&
    isProblemType(error.type, problemCode.ADULT_VERIFICATION_REQUIRED)
  )
}
