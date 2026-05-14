'use client'

import {
  type AppConfig,
  CreateWebWorkerMLCEngine,
  type InitProgressReport,
  type WebWorkerMLCEngine,
} from '@mlc-ai/web-llm'

import type { ModelId } from './webllmModel'

type Options = {
  modelId: ModelId
  appConfig: AppConfig
  onProgress?: (report: InitProgressReport) => void
}

let enginePromise: Promise<WebWorkerMLCEngine> | null = null

export async function createWebLLMEngine({ modelId, appConfig, onProgress }: Options) {
  const isNew = !enginePromise

  if (!enginePromise) {
    const worker = new Worker(new URL('./webllm-worker.ts', import.meta.url), { type: 'module' })

    worker.addEventListener('error', (event) => {
      console.error('[webllm-worker] error', event)
    })

    worker.addEventListener('messageerror', (event) => {
      console.error('[webllm-worker] messageerror', event)
    })

    enginePromise = CreateWebWorkerMLCEngine(worker, modelId, {
      appConfig,
      initProgressCallback: onProgress,
      ...(process.env.NODE_ENV !== 'production' ? { logLevel: 'DEBUG' } : {}),
    })
  }

  const engine = await enginePromise
  engine.setAppConfig(appConfig)

  if (onProgress) {
    engine.setInitProgressCallback(onProgress)
  }

  if (!isNew) {
    await engine.reload(modelId)
  }

  return engine
}
