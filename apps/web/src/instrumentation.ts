import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // service.name, service.namespace and deployment.environment.name are sourced from
    // env (OTEL_SERVICE_NAME / OTEL_RESOURCE_ATTRIBUTES, set per-env in litomi-ops) —
    // the OTel-standard single source for backend resource attributes. Only attributes
    // that env can't supply here are added in code.
    registerOTel({
      attributes: {
        'k8s.namespace.name': process.env.K8S_NAMESPACE_NAME,
        'k8s.node.name': process.env.K8S_NODE_NAME,
        'k8s.pod.name': process.env.K8S_POD_NAME,
        'service.version': process.env.NEXT_PUBLIC_COMMIT_SHA,
      },
      instrumentationConfig: {
        fetch: {
          ignoreUrls: [/sentry\.io/, /grafana\.net/],
        },
      },
    })

    await import('../sentry.server.config')
  }
}

export const onRequestError = Sentry.captureRequestError
