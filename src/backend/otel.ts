import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { NodeSDK } from '@opentelemetry/sdk-node'

declare global {
  // Prevent duplicate SDK startup during local hot reload.
  var __litomiBackendOtelStarted: boolean | undefined
}

export function initBackendOtel() {
  if (globalThis.__litomiBackendOtelStarted) {
    return
  }

  globalThis.__litomiBackendOtelStarted = true

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
  }

  const openTelemetrySDK = new NodeSDK({ traceExporter: new OTLPTraceExporter() })
  openTelemetrySDK.start()

  function shutdown() {
    openTelemetrySDK.shutdown().catch((error: unknown) => {
      console.error('Failed to shutdown OpenTelemetry SDK', error)
    })
  }

  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
}
