'use client'

import { type AppConfig, type ModelRecord, prebuiltAppConfig } from '@mlc-ai/web-llm'

import type { CustomWebLLMModel } from '../storage/webllmModels'

import { BUILTIN_CUSTOM_MODELS_FULL, getCustomWebLLMModels, mergeCustomModels } from '../storage/webllmModels'

const DEV_30B_CTX_LIMIT_STORAGE_KEY = 'litomi:character-chat:dev-30b-ctx-limit'
// Backward compat (old boolean toggle)
const DEV_30B_CTX16K_STORAGE_KEY = 'litomi:character-chat:dev-30b-ctx16k'
const MODEL_ID_30B = 'Qwen3-30B-A3B-q4f16_1-MLC'

export function buildWebLLMAppConfig(customModelsFromStorage = getCustomWebLLMModels()): AppConfig {
  const customModels = mergeCustomModels([...BUILTIN_CUSTOM_MODELS_FULL, ...customModelsFromStorage])
  const customIds = new Set(customModels.map((m) => m.modelId))
  const prebuilt = prebuiltAppConfig.model_list.filter((m) => !customIds.has(m.model_id))
  const custom = customModels.map(toModelRecord)

  return {
    ...prebuiltAppConfig,
    model_list: [...prebuilt, ...custom],
  }
}

function getDev30BCtxLimit(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DEV_30B_CTX_LIMIT_STORAGE_KEY)
    if (raw && raw.length > 0) {
      const v = Number(raw)
      if (Number.isFinite(v) && v > 0) return Math.floor(v)
    }

    // Backward compat: if old toggle is on, treat it as 16k
    if (window.localStorage.getItem(DEV_30B_CTX16K_STORAGE_KEY) === 'true') {
      return 16_384
    }

    return null
  } catch {
    return null
  }
}

function toModelRecord(model: CustomWebLLMModel): ModelRecord {
  const ctxLimit = getDev30BCtxLimit()

  const vramMb =
    typeof model.requiredVramGb === 'number' && Number.isFinite(model.requiredVramGb) && model.requiredVramGb > 0
      ? model.requiredVramGb * 1024
      : undefined

  const contextWindowSize = ctxLimit && model.modelId === MODEL_ID_30B ? ctxLimit : model.contextWindowSize

  return {
    model: model.modelUrl,
    model_id: model.modelId,
    model_lib: model.modelLibUrl,
    ...(contextWindowSize && { overrides: { context_window_size: contextWindowSize } }),
    ...(vramMb && { vram_required_MB: vramMb }),
    low_resource_required: false,
  }
}
