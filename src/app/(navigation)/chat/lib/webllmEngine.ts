'use client'

import type { InitProgressReport, WebWorkerMLCEngine } from '@mlc-ai/web-llm'

import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm'

import type { ModelId } from '../storage/webllmModels'

import { buildWebLLMAppConfig } from './webllmAppConfig'

type Options = {
  modelId: ModelId
  onProgress?: (report: InitProgressReport) => void
}

let enginePromise: Promise<WebWorkerMLCEngine> | null = null

export async function createWebLLMEngine({ modelId, onProgress }: Options) {
  const appConfig = buildWebLLMAppConfig()
  const isNew = !enginePromise

  if (!enginePromise) {
    const worker = new Worker(new URL('./webllm-worker.ts', import.meta.url), { type: 'module' })

    if (process.env.NODE_ENV !== 'production') {
      worker.addEventListener('error', (event) => {
        console.error('[webllm-worker] error', event)
      })
      worker.addEventListener('messageerror', (event) => {
        console.error('[webllm-worker] messageerror', event)
      })
    }

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
