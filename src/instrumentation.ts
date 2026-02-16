import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'

export async function register() {
  registerOTel({ serviceName: 'litomi-web' })
  await import('../sentry.server.config')
}

export const onRequestError = Sentry.captureRequestError
