'use client'

export type CustomWebLLMModel = {
  label: string
  description: string
  modelId: string
  modelUrl: string
  modelLibUrl: string
  requiredVramGb?: number
  contextWindowSize?: number
  supportsThinking: boolean
}

export type ModelId = string

export type SupportedModelId = (typeof MODEL_PRESETS)[number]['modelId']

export const MODEL_PRESETS = [
  {
    label: '0.6B · 핸드폰',
    description: 'Qwen3 0.6B(q4f32_1) · VRAM 1.9GB · Context 4k',
    modelId: 'Qwen3-0.6B-q4f32_1-MLC',
    supportsThinking: true,
    requiredVramGb: 1.9,
  },
  {
    label: '1.7B · 태블릿',
    description: 'Qwen3 1.7B(q4f32_1) · VRAM 2.6GB · Context 4k',
    modelId: 'Qwen3-1.7B-q4f32_1-MLC',
    supportsThinking: false,
    requiredVramGb: 2.6,
  },
  {
    label: '4B · 노트북',
    description: 'Qwen3 4B(q4f16_1) · VRAM 3.4GB · Context 4k',
    modelId: 'Qwen3-4B-q4f16_1-MLC',
    supportsThinking: false,
    requiredVramGb: 3.4,
  },
  {
    label: '8B · 데스크탑',
    description: 'Qwen3 8B(q4f16_1) · VRAM 5.7GB · Context 4k',
    modelId: 'Qwen3-8B-q4f16_1-MLC',
    supportsThinking: true,
    requiredVramGb: 5.7,
  },
  {
    label: '30B · 데스크탑(+GPU)',
    description: 'Qwen3 30B-A3B(q4f16_1) · VRAM 16GB · Context 40k',
    modelId: 'Qwen3-30B-A3B-q4f16_1-ctx40k_cs2k-MLC',
    supportsThinking: true,
    requiredVramGb: 16,
  },
] as const

export const BUILTIN_CUSTOM_MODELS: readonly CustomWebLLMModel[] = [
  {
    label: '30B · 데스트탑(+GPU)',
    description: 'Qwen3 30B-A3B(q4f16_1) · VRAM 16GB · Context 40k',
    modelId: 'Qwen3-30B-A3B-q4f16_1-ctx40k_cs2k-MLC',
    modelUrl: 'https://huggingface.co/mlc-ai/Qwen3-30B-A3B-q4f16_1-MLC',
    modelLibUrl:
      'https://huggingface.co/gwak2837/webllm-model-libs/resolve/main/Qwen3-30B-A3B-q4f16_1-ctx40k_cs2k-webgpu.wasm',
    contextWindowSize: 40_960,
    supportsThinking: true,
  },
] as const

export const DEFAULT_MODEL_ID: SupportedModelId = MODEL_PRESETS[0].modelId

const CUSTOM_MODELS_STORAGE_KEY = 'litomi:character-chat:webllm-custom-models'

export function getCustomWebLLMModels(): CustomWebLLMModel[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY)
    if (!raw) {
      return []
    }
    return parseCustomModels(JSON.parse(raw) as unknown)
  } catch {
    return []
  }
}

export function mergeCustomModels(models: readonly CustomWebLLMModel[]): CustomWebLLMModel[] {
  const map = new Map<string, CustomWebLLMModel>()
  for (const model of models) {
    map.set(model.modelId, model)
  }
  return Array.from(map.values())
}

export function setCustomWebLLMModels(models: readonly CustomWebLLMModel[]) {
  if (typeof window === 'undefined') {
    return
  }

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
  if (!Array.isArray(raw)) {
    return []
  }

  const result: CustomWebLLMModel[] = []

  for (const item of raw) {
    if (!isPlainObject(item)) {
      continue
    }

    const label = typeof item.label === 'string' ? item.label.trim() : null
    const modelId = typeof item.modelId === 'string' ? item.modelId.trim() : null
    const modelUrl = typeof item.modelUrl === 'string' ? item.modelUrl.trim() : null
    const modelLibUrl = typeof item.modelLibUrl === 'string' ? item.modelLibUrl.trim() : null

    if (!label || !modelId || !modelUrl || !modelLibUrl) {
      continue
    }

    const description = typeof item.description === 'string' ? item.description.trim() : ''
    const requiredVramGbRaw = item.requiredVramGb
    const contextWindowSizeRaw = item.contextWindowSize
    const supportsThinking = typeof item.supportsThinking === 'boolean' ? item.supportsThinking : false

    const requiredVramGb =
      typeof requiredVramGbRaw === 'number' && Number.isFinite(requiredVramGbRaw) && requiredVramGbRaw > 0
        ? requiredVramGbRaw
        : undefined

    const contextWindowSize =
      typeof contextWindowSizeRaw === 'number' && Number.isFinite(contextWindowSizeRaw) && contextWindowSizeRaw > 0
        ? Math.floor(contextWindowSizeRaw)
        : undefined

    result.push({
      label,
      description,
      modelId,
      modelUrl,
      modelLibUrl,
      requiredVramGb,
      contextWindowSize,
      supportsThinking,
    })
  }

  return result
}
