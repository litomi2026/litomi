import * as Sentry from '@sentry/nextjs'
import { ErrorInfo } from 'react'

export function createSentryExceptionReporter(name: string) {
  return (error: Error, info: ErrorInfo) => {
    Sentry.captureException(error, { extra: { info, name } })
  }
}
