'use client'

import { type AppConfig, type ModelRecord, prebuiltAppConfig } from '@mlc-ai/web-llm'

import type { CustomWebLLMModel } from '../storage/webllmModels'

import { BUILTIN_CUSTOM_MODELS, getCustomWebLLMModels, mergeCustomModels } from '../storage/webllmModels'

export function buildWebLLMAppConfig(customModelsFromStorage = getCustomWebLLMModels()): AppConfig {
  const customModels = mergeCustomModels([...BUILTIN_CUSTOM_MODELS, ...customModelsFromStorage])
  const customIds = new Set(customModels.map((m) => m.modelId))
  const prebuilt = prebuiltAppConfig.model_list.filter((m) => !customIds.has(m.model_id))
  const custom = customModels.map(toModelRecord)

  return {
    ...prebuiltAppConfig,
    model_list: [...prebuilt, ...custom],
  }
}

function toModelRecord(model: CustomWebLLMModel): ModelRecord {
  const vramMb =
    typeof model.requiredVramGb === 'number' && Number.isFinite(model.requiredVramGb) && model.requiredVramGb > 0
      ? model.requiredVramGb * 1024
      : undefined

  return {
    model: model.modelUrl,
    model_id: model.modelId,
    model_lib: model.modelLibUrl,
    ...(model.contextWindowSize && { overrides: { context_window_size: model.contextWindowSize } }),
    ...(vramMb && { vram_required_MB: vramMb }),
    low_resource_required: false,
  }
}
