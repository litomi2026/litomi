'use client'

import { type AppConfig, type ModelRecord, prebuiltAppConfig } from '@mlc-ai/web-llm'

import { BUILTIN_CUSTOM_MODELS_BY_ID, MODEL_PRESET_IDS } from './webllmModel'

export type ContextWindowPercent = 10 | 100 | 25 | 50

export type EngineModelInput = {
  modelId: string
  modelUrl: string
  modelLibUrl: string
  requiredVramMb?: number
  contextWindowSize?: number
}

type BuildWebLLMAppConfigArgs = {
  customModels: readonly EngineModelInput[]
  contextWindowPercent: ContextWindowPercent
}

export function buildWebLLMAppConfig({ customModels, contextWindowPercent }: BuildWebLLMAppConfigArgs): AppConfig {
  const builtins: EngineModelInput[] = Object.entries(BUILTIN_CUSTOM_MODELS_BY_ID).map(([modelId, m]) => ({
    modelId,
    modelUrl: m.modelUrl,
    modelLibUrl: m.modelLibUrl,
    requiredVramMb: m.requiredVramMb,
    contextWindowSize: m.contextWindowSize,
  }))

  const merged = mergeModels([...builtins, ...customModels])
  const customIds = new Set(merged.map((m) => m.modelId))
  const presetIds = new Set<string>(MODEL_PRESET_IDS)
  const custom = merged.map((m) => toModelRecord(m, contextWindowPercent))

  const prebuilt = prebuiltAppConfig.model_list
    .filter((m) => presetIds.has(m.model_id) && !customIds.has(m.model_id))
    .map((m) => applyContextWindowPercentToModelRecord(m, contextWindowPercent))

  return { ...prebuiltAppConfig, model_list: [...prebuilt, ...custom] }
}

export function computeContextWindowSizeFromPercent(
  maxContextWindowSize: number,
  contextWindowPercent: ContextWindowPercent,
): number {
  if (!Number.isFinite(maxContextWindowSize) || maxContextWindowSize <= 0) return 4096
  if (contextWindowPercent === 100) return Math.floor(maxContextWindowSize)

  const raw = Math.floor((maxContextWindowSize * contextWindowPercent) / 100)
  const quant = 256
  const rounded = Math.max(2048, Math.floor(raw / quant) * quant)
  return Math.min(Math.floor(maxContextWindowSize), rounded)
}

function applyContextWindowPercentToModelRecord(
  record: ModelRecord,
  contextWindowPercent: ContextWindowPercent,
): ModelRecord {
  const maxContextWindowSize = record.overrides?.context_window_size
  if (typeof maxContextWindowSize !== 'number' || !Number.isFinite(maxContextWindowSize) || maxContextWindowSize <= 0) {
    return record
  }

  const next = computeContextWindowSizeFromPercent(maxContextWindowSize, contextWindowPercent)

  return {
    ...record,
    overrides: {
      ...record.overrides,
      context_window_size: next,
    },
  }
}

function mergeModels(models: readonly EngineModelInput[]): EngineModelInput[] {
  const map = new Map<string, EngineModelInput>()
  for (const model of models) {
    map.set(model.modelId, model)
  }
  return Array.from(map.values())
}

function toModelRecord(model: EngineModelInput, contextWindowPercent: ContextWindowPercent): ModelRecord {
  const vramMb = typeof model.requiredVramMb === 'number' ? model.requiredVramMb : null
  const maxContextWindowSize = model.contextWindowSize
  const contextWindowSize =
    typeof maxContextWindowSize === 'number'
      ? computeContextWindowSizeFromPercent(maxContextWindowSize, contextWindowPercent)
      : null

  return {
    model: model.modelUrl,
    model_id: model.modelId,
    model_lib: model.modelLibUrl,
    ...(contextWindowSize && { overrides: { context_window_size: contextWindowSize } }),
    ...(vramMb && { vram_required_MB: vramMb }),
    low_resource_required: false,
  }
}
