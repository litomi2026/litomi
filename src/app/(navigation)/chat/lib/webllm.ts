'use client'

import * as webllm from '@mlc-ai/web-llm'

export type CustomWebLLMModel = {
  label: string
  description: string
  modelId: string
  modelUrl: string
  modelLibUrl: string
  requiredVramGb?: number
  supportsThinking: boolean
}

export type InitProgressReport = webllm.InitProgressReport

export type ModelId = string

export type WebLLMEngine = webllm.WebWorkerMLCEngine

const CUSTOM_MODELS_STORAGE_KEY = 'litomi:character-chat:webllm-custom-models'

export function buildWebLLMAppConfig(
  customModels: readonly CustomWebLLMModel[] = getCustomWebLLMModels(),
): webllm.AppConfig {
  const customIds = new Set(customModels.map((m) => m.modelId))
  const prebuilt = webllm.prebuiltAppConfig.model_list.filter((m) => !customIds.has(m.model_id))
  const custom = customModels.map(toModelRecord)

  return {
    ...webllm.prebuiltAppConfig,
    model_list: [...prebuilt, ...custom],
  }
}

export function getCustomWebLLMModels(): CustomWebLLMModel[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY)
    if (!raw) return []
    return parseCustomModels(JSON.parse(raw) as unknown)
  } catch {
    return []
  }
}

export function setCustomWebLLMModels(models: readonly CustomWebLLMModel[]): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify(models))
  } catch {
    // ignore
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCustomModels(raw: unknown): CustomWebLLMModel[] {
  if (!Array.isArray(raw)) return []

  const result: CustomWebLLMModel[] = []

  for (const item of raw) {
    if (!isPlainObject(item)) continue

    const label = typeof item.label === 'string' ? item.label.trim() : null
    const description = typeof item.description === 'string' ? item.description.trim() : ''
    const modelId = typeof item.modelId === 'string' ? item.modelId.trim() : null
    const modelUrl = typeof item.modelUrl === 'string' ? item.modelUrl.trim() : null
    const modelLibUrl = typeof item.modelLibUrl === 'string' ? item.modelLibUrl.trim() : null
    const requiredVramGbRaw = item.requiredVramGb
    const requiredVramGb =
      typeof requiredVramGbRaw === 'number' && Number.isFinite(requiredVramGbRaw) && requiredVramGbRaw > 0
        ? requiredVramGbRaw
        : undefined
    const supportsThinking = typeof item.supportsThinking === 'boolean' ? item.supportsThinking : false

    if (!label || !modelId || !modelUrl || !modelLibUrl) continue

    result.push({
      label,
      description,
      modelId,
      modelUrl,
      modelLibUrl,
      requiredVramGb,
      supportsThinking,
    })
  }

  return result
}

function toModelRecord(model: CustomWebLLMModel): webllm.ModelRecord {
  const vramMb =
    typeof model.requiredVramGb === 'number' && Number.isFinite(model.requiredVramGb) && model.requiredVramGb > 0
      ? model.requiredVramGb * 1024
      : undefined

  return {
    model: model.modelUrl,
    model_id: model.modelId,
    model_lib: model.modelLibUrl,
    ...(vramMb ? { vram_required_MB: vramMb } : {}),
    low_resource_required: false,
  }
}

// NOTE:
// We intentionally use WebLLM's built-in model hosting (same as https://chat.webllm.ai).
// This downloads model artifacts from HuggingFace + wasm model libs from GitHub raw
// via WebLLM's `prebuiltAppConfig.model_list`.
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
  modelId: ModelId
  onProgress?: (report: InitProgressReport) => void
}) {
  const appConfig = buildWebLLMAppConfig()
  const isNew = !enginePromise

  if (!enginePromise) {
    const worker = new Worker(new URL('./webllm-worker.ts', import.meta.url), { type: 'module' })

    enginePromise = webllm.CreateWebWorkerMLCEngine(worker, options.modelId, {
      appConfig,
      initProgressCallback: options.onProgress,
    })
  }

  const engine = await enginePromise

  engine.setAppConfig(appConfig)

  if (options.onProgress) {
    engine.setInitProgressCallback(options.onProgress)
  }

  if (!isNew) {
    // If the engine already exists (because another model was loaded before),
    // reload ensures we are on the selected model.
    await engine.reload(options.modelId)
  }

  return engine
}

export async function deleteInstalledModel(modelId: ModelId): Promise<void> {
  await webllm.deleteModelAllInfoInCache(modelId, buildWebLLMAppConfig())
}

export async function hasInstalledModel(modelId: ModelId): Promise<boolean> {
  return await webllm.hasModelInCache(modelId, buildWebLLMAppConfig())
}
