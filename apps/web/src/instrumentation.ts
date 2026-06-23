import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    registerOTel({ attributes: { 'service.version': process.env.NEXT_PUBLIC_COMMIT_SHA } })
    await import('../sentry.server.config')
  }
}

export const onRequestError = Sentry.captureRequestError
