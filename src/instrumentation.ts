import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    registerOTel({ serviceName: 'litomi-web' })
    await import('../sentry.server.config')
  }
}

export const onRequestError = Sentry.captureRequestError
