/// <reference lib="webworker" />

import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'

const handler = new WebWorkerMLCEngineHandler()

self.addEventListener('unhandledrejection', (event) => {
  console.error('[webllm-worker] unhandledrejection', event.reason)
})

self.addEventListener('error', (event) => {
  console.error('[webllm-worker] error', event)
})

self.onmessage = (event) => {
  handler.onmessage(event)
}
