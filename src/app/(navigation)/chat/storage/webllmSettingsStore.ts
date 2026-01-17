'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKey } from '@/constants/storage'

import { type CustomWebLLMModel, DEFAULT_MODEL_ID, type ModelId } from '../lib/webllmModel'

type WebLLMSettingsStore = {
  isAutoModelEnabled: boolean
  manualModelId: ModelId
  isThinkingEnabled: boolean
  showThinkingTrace: boolean
  dev30BCtxLimit: number | null
  customModels: CustomWebLLMModel[]

  setIsAutoModelEnabled: (enabled: boolean) => void
  setModelId: (modelId: ModelId) => void
  setIsThinkingEnabled: (enabled: boolean) => void
  setShowThinkingTrace: (enabled: boolean) => void
  setDev30BCtxLimit: (limit: number | null) => void
  addCustomModel: (model: CustomWebLLMModel) => { ok: false; message: string } | { ok: true }
  removeCustomModel: (modelId: string) => void
}

function normalizeCustomModel(model: CustomWebLLMModel): CustomWebLLMModel {
  return {
    ...model,
    label: model.label.trim(),
    description: model.description.trim(),
    modelId: model.modelId.trim(),
    modelUrl: model.modelUrl.trim(),
    modelLibUrl: model.modelLibUrl.trim(),
    requiredVramGb: typeof model.requiredVramGb === 'number' ? model.requiredVramGb : undefined,
  }
}

function sortCustomModels(models: readonly CustomWebLLMModel[]): CustomWebLLMModel[] {
  return [...models].sort((a, b) => {
    const av = typeof a.requiredVramGb === 'number' ? a.requiredVramGb : Number.POSITIVE_INFINITY
    const bv = typeof b.requiredVramGb === 'number' ? b.requiredVramGb : Number.POSITIVE_INFINITY
    if (av !== bv) return av - bv
    return a.label.localeCompare(b.label)
  })
}

export const useWebLLMSettingsStore = create<WebLLMSettingsStore>()(
  persist(
    (set, get) => ({
      isAutoModelEnabled: true,
      manualModelId: DEFAULT_MODEL_ID,
      isThinkingEnabled: false,
      showThinkingTrace: false,
      dev30BCtxLimit: null,
      customModels: [],

      setIsAutoModelEnabled: (enabled: boolean) => set({ isAutoModelEnabled: enabled }),
      setModelId: (modelId: ModelId) => set({ isAutoModelEnabled: false, manualModelId: modelId }),
      setIsThinkingEnabled: (enabled: boolean) => set({ isThinkingEnabled: enabled }),
      setShowThinkingTrace: (enabled: boolean) => set({ showThinkingTrace: enabled }),
      setDev30BCtxLimit: (limit: number | null) => set({ dev30BCtxLimit: limit }),

      addCustomModel: (model: CustomWebLLMModel) => {
        const next = normalizeCustomModel(model)

        if (!next.label) {
          return { ok: false, message: '모델 이름을 입력해 주세요' }
        }
        if (!next.modelId) {
          return { ok: false, message: 'model_id를 입력해 주세요' }
        }
        if (!next.modelUrl) {
          return { ok: false, message: 'HuggingFace URL을 입력해 주세요' }
        }
        if (!next.modelLibUrl) {
          return { ok: false, message: 'model_lib URL을 입력해 주세요' }
        }
        if (
          typeof next.requiredVramGb === 'number' &&
          (!Number.isFinite(next.requiredVramGb) || next.requiredVramGb <= 0)
        ) {
          return { ok: false, message: 'VRAM(GB)을 올바르게 입력해 주세요' }
        }

        const state = get()
        const updated = sortCustomModels([...state.customModels.filter((m) => m.modelId !== next.modelId), next])
        set({
          customModels: updated,
          isAutoModelEnabled: false,
          manualModelId: next.modelId,
        })

        return { ok: true }
      },

      removeCustomModel: (modelId: string) => {
        const trimmed = modelId.trim()
        const state = get()
        const updated = state.customModels.filter((m) => m.modelId !== trimmed)
        const shouldResetModelId = !state.isAutoModelEnabled && state.manualModelId === trimmed

        if (shouldResetModelId) {
          set({ customModels: updated, manualModelId: DEFAULT_MODEL_ID })
          return
        }

        set({ customModels: updated })
      },
    }),
    { name: LocalStorageKey.CHAT_WEBLLM_SETTINGS },
  ),
)
