'use client'

import { type AppConfig, type ModelRecord, prebuiltAppConfig } from '@mlc-ai/web-llm'

import { BUILTIN_CUSTOM_MODELS_BY_ID, MODEL_PRESET_IDS } from './webllmModel'

const MODEL_ID_30B = 'Qwen3-30B-A3B-q4f16_1-MLC'

export type EngineModelInput = {
  modelId: string
  modelUrl: string
  modelLibUrl: string
  requiredVramGb?: number
  contextWindowSize?: number
}

type BuildWebLLMAppConfigArgs = {
  customModels: readonly EngineModelInput[]
  dev30BCtxLimit: number | null
}

export function buildWebLLMAppConfig({ customModels, dev30BCtxLimit }: BuildWebLLMAppConfigArgs): AppConfig {
  const builtins: EngineModelInput[] = Object.entries(BUILTIN_CUSTOM_MODELS_BY_ID).map(([modelId, m]) => ({
    modelId,
    modelUrl: m.modelUrl,
    modelLibUrl: m.modelLibUrl,
    requiredVramGb: m.requiredVramGb,
    contextWindowSize: m.contextWindowSize,
  }))

  const merged = mergeModels([...builtins, ...customModels])
  const customIds = new Set(merged.map((m) => m.modelId))
  const presetIds = new Set<string>(MODEL_PRESET_IDS)
  const prebuilt = prebuiltAppConfig.model_list.filter((m) => presetIds.has(m.model_id) && !customIds.has(m.model_id))
  const custom = merged.map((m) => toModelRecord(m, dev30BCtxLimit))

  return { ...prebuiltAppConfig, model_list: [...prebuilt, ...custom] }
}

function mergeModels(models: readonly EngineModelInput[]): EngineModelInput[] {
  const map = new Map<string, EngineModelInput>()
  for (const model of models) {
    map.set(model.modelId, model)
  }
  return Array.from(map.values())
}

function toModelRecord(model: EngineModelInput, dev30BCtxLimit: number | null): ModelRecord {
  const vramMb = model.requiredVramGb ? model.requiredVramGb * 1024 : null
  const contextWindowSize = dev30BCtxLimit && model.modelId === MODEL_ID_30B ? dev30BCtxLimit : model.contextWindowSize

  return {
    model: model.modelUrl,
    model_id: model.modelId,
    model_lib: model.modelLibUrl,
    ...(contextWindowSize && { overrides: { context_window_size: contextWindowSize } }),
    ...(vramMb && { vram_required_MB: vramMb }),
    low_resource_required: false,
  }
}
