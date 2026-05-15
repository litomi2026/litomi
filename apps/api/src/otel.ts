import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { NodeSDK } from '@opentelemetry/sdk-node'

let openTelemetrySDK: NodeSDK | undefined

export function initBackendOtel() {
  if (openTelemetrySDK) {
    return
  }

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
  }

  const sdk = new NodeSDK({ traceExporter: new OTLPTraceExporter() })
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
