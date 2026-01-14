'use client'

import { prebuiltAppConfig } from '@mlc-ai/web-llm'

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

export type ResolvedPreset = MinimalPreset & {
  description: string
  requiredVramGb: number
}

export type SupportedModelId = (typeof MODEL_PRESETS)[number]['modelId']

type MinimalPreset = (typeof MODEL_PRESETS)[number]

type RecordLike = {
  vram_required_MB?: number
  overrides?: { context_window_size?: number }
}

export const MODEL_PRESETS = [
  {
    label: '0.6B · 핸드폰',
    modelId: 'Qwen3-0.6B-q4f32_1-MLC',
    supportsThinking: false,
  },
  {
    label: '1.7B · 태블릿',
    modelId: 'Qwen3-1.7B-q4f16_1-MLC',
    supportsThinking: false,
  },
  {
    label: '4B · 노트북',
    modelId: 'Qwen3-4B-q4f16_1-MLC',
    supportsThinking: false,
  },
  {
    label: '8B · 데스크탑',
    modelId: 'Qwen3-8B-q4f16_1-MLC',
    supportsThinking: true,
  },
  {
    label: '30B · 데스크탑(+GPU)',
    modelId: 'Qwen3-30B-A3B-q4f16_1-MLC',
    supportsThinking: true,
  },
] as const

export const BUILTIN_CUSTOM_MODELS = [
  {
    modelId: 'Qwen3-30B-A3B-q4f16_1-MLC',
    modelUrl: 'https://huggingface.co/mlc-ai/Qwen3-30B-A3B-q4f16_1-MLC',
    modelLibUrl:
      'https://huggingface.co/gwak2837/webllm-model-libs/resolve/main/Qwen3-30B-A3B-q4f16_1-ctx40k_cs2k-webgpu.wasm',
    requiredVramGb: 16,
    contextWindowSize: 40_960,
  },
] as const

export const DEFAULT_MODEL_ID: SupportedModelId = MODEL_PRESETS[0].modelId

const MODEL_PRESET_BY_ID = new Map(MODEL_PRESETS.map((p) => [p.modelId, p]))
const PREBUILT_RECORD_BY_ID = new Map(prebuiltAppConfig.model_list.map((m) => [m.model_id, m]))

const BUILTIN_RECORD_BY_ID = new Map<string, RecordLike>(
  BUILTIN_CUSTOM_MODELS.map((m) => [
    m.modelId,
    {
      vram_required_MB: m.requiredVramGb * 1024,
      overrides: { context_window_size: m.contextWindowSize },
    },
  ]),
)

const RESOLVED_MODEL_PRESET_BY_ID = new Map(MODEL_PRESETS.map((p) => [p.modelId, resolveModelPreset(p)]))

export const RESOLVED_MODEL_PRESETS = MODEL_PRESETS.map((p) => RESOLVED_MODEL_PRESET_BY_ID.get(p.modelId)!)

export const BUILTIN_CUSTOM_MODELS_FULL = BUILTIN_CUSTOM_MODELS.map((m) => {
  const preset = MODEL_PRESET_BY_ID.get(m.modelId)!
  const resolved = RESOLVED_MODEL_PRESET_BY_ID.get(m.modelId)!

  return {
    label: preset.label,
    description: resolved.description,
    modelId: m.modelId,
    modelUrl: m.modelUrl,
    modelLibUrl: m.modelLibUrl,
    requiredVramGb: m.requiredVramGb,
    contextWindowSize: m.contextWindowSize,
    supportsThinking: preset.supportsThinking,
  }
})

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

function resolveModelPreset(preset: MinimalPreset): ResolvedPreset {
  const record = PREBUILT_RECORD_BY_ID.get(preset.modelId) ?? BUILTIN_RECORD_BY_ID.get(preset.modelId)!
  const vramMb = record.vram_required_MB ?? 0
  const vramGb = vramMb / 1024
  const context = record.overrides?.context_window_size
  const contextText = context ? `${context / 1024}k` : '?'

  return {
    ...preset,
    requiredVramGb: vramGb,
    description: `${preset.modelId.replaceAll('-', ' ')} · VRAM ${vramGb.toFixed(1)}GB · Context ${contextText}`,
  }
}
