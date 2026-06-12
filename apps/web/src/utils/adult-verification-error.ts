import { isProblemType, problemCode } from '@litomi/http/problem-details'

import { ProblemDetailsError } from '@/utils/fetch-response'

export function isAdultVerificationRequiredError(error: unknown): boolean {
  return (
    error instanceof ProblemDetailsError &&
    error.status === 403 &&
    isProblemType(error.type, problemCode.ADULT_VERIFICATION_REQUIRED)
  )
}
