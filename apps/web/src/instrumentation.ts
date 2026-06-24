import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    registerOTel({
      attributes: {
        'k8s.node.name': process.env.K8S_NODE_NAME,
        'service.version': process.env.NEXT_PUBLIC_COMMIT_SHA,
      },
    })

    await import('../sentry.server.config')
  }
}

export const onRequestError = Sentry.captureRequestError
