'use client'

import { prebuiltAppConfig } from '@mlc-ai/web-llm'

export type CustomWebLLMModel = {
  label: string
  description: string
  modelId: string
  modelUrl: string
  modelLibUrl: string
  requiredVramMb?: number
  contextWindowSize?: number
  supportsThinking: boolean
}

export type ModelId = string

export type ResolvedPreset = {
  label: string
  modelId: ModelId
  supportsThinking: boolean
  requiredVramMb?: number
  contextWindowSize?: number
}

export type SupportedModelId = (typeof MODEL_PRESET_IDS)[number]

type BuiltinCustomModelDef = {
  modelUrl: string
  modelLibUrl: string
  requiredVramMb: number
  contextWindowSize: number
}

type PresetMeta = {
  label: string
  supportsThinking: boolean
}

export const MODEL_PRESET_IDS = [
  'Qwen3-4B-q4f16_1-MLC',
  'Qwen3-8B-q4f16_1-MLC',
  'Qwen3-14B-q4f16_1-MLC',
  'Qwen3-30B-A3B-q4f16_1-MLC',
] as const

const MODEL_PRESET_META = {
  'Qwen3-4B-q4f16_1-MLC': {
    label: '4B · 태블릿',
    supportsThinking: true,
  },
  'Qwen3-8B-q4f16_1-MLC': {
    label: '8B · 노트북',
    supportsThinking: true,
  },
  'Qwen3-14B-q4f16_1-MLC': {
    label: '14B · 데스크탑',
    supportsThinking: true,
  },
  'Qwen3-30B-A3B-q4f16_1-MLC': {
    label: '30B · 데스크탑(+GPU)',
    supportsThinking: true,
  },
} satisfies Record<SupportedModelId, PresetMeta>

export const BUILTIN_CUSTOM_MODELS_BY_ID: Record<ModelId, BuiltinCustomModelDef> = {
  'Qwen3-14B-q4f16_1-MLC': {
    modelUrl: 'https://huggingface.co/mlc-ai/Qwen3-14B-q4f16_1-MLC',
    modelLibUrl:
      'https://huggingface.co/gwak2837/webllm-model-libs/resolve/main/Qwen3-14B-q4f16_1-ctx40k_cs2k-webgpu.wasm',
    requiredVramMb: 7923,
    contextWindowSize: 40_960,
  },
  'Qwen3-30B-A3B-q4f16_1-MLC': {
    modelUrl: 'https://huggingface.co/mlc-ai/Qwen3-30B-A3B-q4f16_1-MLC',
    modelLibUrl:
      'https://huggingface.co/gwak2837/webllm-model-libs/resolve/main/Qwen3-30B-A3B-q4f16_1-ctx40k_cs2k-webgpu.wasm',
    requiredVramMb: 16397,
    contextWindowSize: 40_960,
  },
}

export const DEFAULT_MODEL_ID: SupportedModelId = MODEL_PRESET_IDS[0]
export const RESOLVED_MODEL_PRESETS = MODEL_PRESET_IDS.map((modelId) => resolveModelPreset(modelId))

function resolveModelPreset(modelId: SupportedModelId): ResolvedPreset {
  const meta = MODEL_PRESET_META[modelId]
  const record = prebuiltAppConfig.model_list.find((m) => m.model_id === modelId)

  if (record) {
    const vramMb = record.vram_required_MB
    const contextWindowSize = record.overrides?.context_window_size

    return {
      label: meta.label,
      modelId,
      supportsThinking: meta.supportsThinking,
      ...(vramMb && { requiredVramMb: vramMb }),
      ...(contextWindowSize && { contextWindowSize }),
    }
  }

  const builtin = BUILTIN_CUSTOM_MODELS_BY_ID[modelId]

  return {
    label: meta.label,
    modelId,
    supportsThinking: meta.supportsThinking,
    requiredVramMb: builtin.requiredVramMb,
    contextWindowSize: builtin.contextWindowSize,
  }
}
