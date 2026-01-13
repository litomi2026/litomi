'use client'

import * as webllm from '@mlc-ai/web-llm'

export type InitProgressReport = webllm.InitProgressReport

export type WebLLMEngine = webllm.WebWorkerMLCEngine

// NOTE:
// We intentionally use WebLLM's built-in model hosting (same as https://chat.webllm.ai).
// This downloads model artifacts from HuggingFace + wasm model libs from GitHub raw
// via WebLLM's `prebuiltAppConfig.model_list`.
//
// We keep a small set of presets instead of exposing the full model list.
export const MODEL_PRESETS = [
  {
    label: '0.6B · 1.4GB',
    description: 'Qwen3 0.6B(q4f16) · 모바일에 적합해요',
    modelId: 'Qwen3-0.6B-q4f16_1-MLC',
    supportsThinking: true,
    requiredVramGb: 1.4,
  },
  {
    label: '1.5B · 1.6GB',
    description: 'Qwen2.5 1.5B Instruct(q4f16) · 모바일에 적합해요',
    modelId: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    supportsThinking: false,
    requiredVramGb: 1.6,
  },
  {
    label: '7B · 5.1GB',
    description: 'Qwen2.5 7B Instruct(q4f16) · 데스크탑에 적합해요',
    modelId: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    supportsThinking: false,
    requiredVramGb: 5.1,
  },
  {
    label: '8B · 6.9GB',
    description: 'Qwen3 8B Instruct(q4f32) · 데스크탑에 적합해요',
    modelId: 'Qwen3-8B-q4f32_1-MLC',
    supportsThinking: true,
    requiredVramGb: 6.9,
  },
] as const

export type SupportedModelId = (typeof MODEL_PRESETS)[number]['modelId']

export const DEFAULT_MODEL_ID: SupportedModelId = MODEL_PRESETS[0].modelId

let enginePromise: Promise<WebLLMEngine> | null = null

export async function createWebLLMEngine(options: {
  modelId: SupportedModelId
  onProgress?: (report: InitProgressReport) => void
}) {
  if (!enginePromise) {
    const worker = new Worker(new URL('./webllm-worker.ts', import.meta.url), { type: 'module' })

    enginePromise = webllm.CreateWebWorkerMLCEngine(worker, options.modelId, {
      initProgressCallback: options.onProgress,
    })
  }

  const engine = await enginePromise

  if (options.onProgress) {
    engine.setInitProgressCallback(options.onProgress)
  }

  // If the engine already exists (because another model was loaded before),
  // reload ensures we are on the selected model.
  await engine.reload(options.modelId)

  return engine
}

export async function deleteInstalledModel(modelId: SupportedModelId): Promise<void> {
  await webllm.deleteModelAllInfoInCache(modelId)
}

export async function hasInstalledModel(modelId: SupportedModelId): Promise<boolean> {
  return await webllm.hasModelInCache(modelId)
}
