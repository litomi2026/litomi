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
    key: 'default',
    label: '3B · 약 2.3GB',
    description: 'Hermes 3 (Llama 3.2 3B) · 캐릭터 롤플레이 밸런스가 좋아요',
    modelId: 'Hermes-3-Llama-3.2-3B-q4f16_1-MLC',
  },
  {
    key: 'ko',
    label: '7B · 약 5.1GB',
    description: 'Qwen2.5 7B · 한국어 답변 품질을 더 우선해요',
    modelId: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
  },
  {
    key: 'hq',
    label: '8B · 약 4.9GB',
    description: 'Hermes 3 (Llama 3.1 8B) · 더 자연스럽지만 설치/속도가 부담될 수 있어요',
    modelId: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
  },
] as const

export type ModelPresetKey = (typeof MODEL_PRESETS)[number]['key']
export type SupportedModelId = (typeof MODEL_PRESETS)[number]['modelId']

export const DEFAULT_MODEL_PRESET_KEY: ModelPresetKey = 'default'

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
