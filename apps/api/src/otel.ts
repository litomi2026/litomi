import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { AggregationType } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'

let openTelemetrySDK: NodeSDK | undefined

export function initBackendOtel() {
  if (openTelemetrySDK) {
    return
  }

  const COMMIT_SHA = process.env.COMMIT_SHA
  const K8S_NODE_NAME = process.env.K8S_NODE_NAME
  const K8S_NAMESPACE_NAME = process.env.K8S_NAMESPACE_NAME
  const K8S_POD_NAME = process.env.K8S_POD_NAME

  process.env.OTEL_RESOURCE_ATTRIBUTES = [
    process.env.OTEL_RESOURCE_ATTRIBUTES,
    COMMIT_SHA && `service.version=${COMMIT_SHA}`,
    K8S_NODE_NAME && `k8s.node.name=${K8S_NODE_NAME}`,
    K8S_NAMESPACE_NAME && `k8s.namespace.name=${K8S_NAMESPACE_NAME}`,
    K8S_POD_NAME && `k8s.pod.name=${K8S_POD_NAME}`,
  ]
    .filter(Boolean)
    .join(',')

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
  }

  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    // Coarsen @hono/otel's http.server.request.duration histogram from 14 default
    // buckets to 7 to keep Grafana Cloud free-tier active series under the cap.
    views: [
      {
        instrumentName: 'http.server.request.duration',
        aggregation: {
          type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
          options: { boundaries: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5] },
        },
      },
    ],
  })

  sdk.start()
  openTelemetrySDK = sdk
}

export async function shutdownBackendOtel(): Promise<void> {
  if (!openTelemetrySDK) {
    return
  }

  const sdk = openTelemetrySDK
  openTelemetrySDK = undefined

  await sdk.shutdown()
}
