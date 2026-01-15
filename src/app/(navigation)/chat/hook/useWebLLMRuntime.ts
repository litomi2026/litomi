'use client'

import type { InitProgressReport, WebWorkerMLCEngine } from '@mlc-ai/web-llm'

import { useEffect, useRef, useState } from 'react'

import { buildWebLLMAppConfig } from '../lib/webllmAppConfig'
import { deleteInstalledModel, hasInstalledModel } from '../lib/webllmCache'
import { createWebLLMEngine } from '../lib/webllmEngine'
import {
  type CustomWebLLMModel,
  DEFAULT_MODEL_ID,
  getCustomWebLLMModels,
  MODEL_PRESETS,
  type ModelId,
  RESOLVED_MODEL_PRESETS,
  setCustomWebLLMModels,
} from '../storage/webllmModels'
import { useStateWithRef } from './useStateWithRef'

const MODEL_ID_STORAGE_KEY = 'litomi:character-chat:model-id'
const AUTO_MODEL_ENABLED_STORAGE_KEY = 'litomi:character-chat:auto-model-enabled'
const THINKING_ENABLED_STORAGE_KEY = 'litomi:character-chat:thinking-enabled'
const SHOW_THINKING_TRACE_STORAGE_KEY = 'litomi:character-chat:show-thinking-trace'

type InstallState =
  | { kind: 'error'; message: string }
  | { kind: 'installed' }
  | { kind: 'installing'; progress: InitProgressReport }
  | { kind: 'not-installed' }
  | { kind: 'unknown' }

type SelectableModel = {
  label: string
  description: string
  modelId: ModelId
  supportsThinking: boolean
  requiredVramGb?: number
}

export function useWebLLMRuntime() {
  const [customModels, setCustomModelsState] = useState<CustomWebLLMModel[]>(() => getCustomWebLLMModels())

  const [isAutoModelEnabled, setIsAutoModelEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(AUTO_MODEL_ENABLED_STORAGE_KEY) !== 'false'
  })

  const [manualModelId, setManualModelIdState] = useState<ModelId>(() => {
    if (typeof window === 'undefined') return DEFAULT_MODEL_ID
    const saved = window.localStorage.getItem(MODEL_ID_STORAGE_KEY)
    if (!saved) return DEFAULT_MODEL_ID
    if (MODEL_PRESETS.some((p) => p.modelId === saved)) return saved
    if (getCustomWebLLMModels().some((m) => m.modelId === saved)) return saved
    return DEFAULT_MODEL_ID
  })

  const modelId: ModelId = isAutoModelEnabled ? DEFAULT_MODEL_ID : manualModelId
  const model = buildWebLLMAppConfig(customModels).model_list.find((m) => m.model_id === modelId)
  const modelContextWindowSize = model?.overrides?.context_window_size

  const [isThinkingEnabled, setIsThinkingEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(THINKING_ENABLED_STORAGE_KEY) === 'true'
  })

  const [showThinkingTrace, setShowThinkingTraceState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SHOW_THINKING_TRACE_STORAGE_KEY) === 'true'
  })

  const modelPresets: readonly SelectableModel[] = [
    ...RESOLVED_MODEL_PRESETS,
    ...customModels.map((m) => ({
      label: m.label,
      description: m.description || '커스텀 모델이에요',
      modelId: m.modelId,
      supportsThinking: m.supportsThinking,
      requiredVramGb: m.requiredVramGb,
    })),
  ]

  const modelPreset = modelPresets.find((p) => p.modelId === modelId) ?? modelPresets[0]

  const [engine, setEngine, engineRef] = useStateWithRef<WebWorkerMLCEngine | null>(null)
  const loadedModelIdRef = useRef<ModelId | null>(null)
  const [installState, setInstallState] = useState<InstallState>({ kind: 'unknown' })

  function setIsAutoModelEnabled(nextEnabled: boolean) {
    setIsAutoModelEnabledState(nextEnabled)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTO_MODEL_ENABLED_STORAGE_KEY, String(nextEnabled))
    }
  }

  function setModelId(nextModelId: ModelId) {
    setIsAutoModelEnabledState(false)
    setManualModelIdState(nextModelId)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODEL_ID_STORAGE_KEY, nextModelId)
      window.localStorage.setItem(AUTO_MODEL_ENABLED_STORAGE_KEY, 'false')
    }
  }

  function addCustomModel(model: CustomWebLLMModel): { ok: false; message: string } | { ok: true } {
    const next: CustomWebLLMModel = {
      ...model,
      label: model.label.trim(),
      description: model.description.trim(),
      modelId: model.modelId.trim(),
      modelUrl: model.modelUrl.trim(),
      modelLibUrl: model.modelLibUrl.trim(),
    }

    if (!next.label) return { ok: false, message: '모델 이름을 입력해 주세요' }
    if (!next.modelId) return { ok: false, message: 'model_id를 입력해 주세요' }
    if (!next.modelUrl) return { ok: false, message: 'HuggingFace URL을 입력해 주세요' }
    if (!next.modelLibUrl) return { ok: false, message: 'model_lib URL을 입력해 주세요' }
    if (
      typeof next.requiredVramGb === 'number' &&
      (!Number.isFinite(next.requiredVramGb) || next.requiredVramGb <= 0)
    ) {
      return { ok: false, message: 'VRAM(GB)을 올바르게 입력해 주세요' }
    }

    const updated = [...customModels.filter((m) => m.modelId !== next.modelId), next].sort((a, b) => {
      const av = typeof a.requiredVramGb === 'number' ? a.requiredVramGb : Number.POSITIVE_INFINITY
      const bv = typeof b.requiredVramGb === 'number' ? b.requiredVramGb : Number.POSITIVE_INFINITY
      if (av !== bv) return av - bv
      return a.label.localeCompare(b.label)
    })

    setCustomModelsState(updated)
    setCustomWebLLMModels(updated)
    engineRef.current?.setAppConfig(buildWebLLMAppConfig(updated))

    setModelId(next.modelId)

    return { ok: true }
  }

  function removeCustomModel(customModelId: string) {
    const trimmed = customModelId.trim()
    const updated = customModels.filter((m) => m.modelId !== trimmed)
    setCustomModelsState(updated)
    setCustomWebLLMModels(updated)
    engineRef.current?.setAppConfig(buildWebLLMAppConfig(updated))

    if (!isAutoModelEnabled && manualModelId === trimmed) {
      setManualModelIdState(DEFAULT_MODEL_ID)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(MODEL_ID_STORAGE_KEY, DEFAULT_MODEL_ID)
      }
    }
  }

  function setIsThinkingEnabled(nextEnabled: boolean) {
    setIsThinkingEnabledState(nextEnabled)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THINKING_ENABLED_STORAGE_KEY, String(nextEnabled))
    }
  }

  function setShowThinkingTrace(nextEnabled: boolean) {
    setShowThinkingTraceState(nextEnabled)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SHOW_THINKING_TRACE_STORAGE_KEY, String(nextEnabled))
    }
  }

  async function refreshInstallState() {
    setInstallState({ kind: 'unknown' })
    setInstallState(await getModelInstallState(modelId))
  }

  useEffect(() => {
    let cancelled = false
    setInstallState({ kind: 'unknown' })
    void (async () => {
      const next = await getModelInstallState(modelId)
      if (cancelled) return
      setInstallState(next)
    })()

    return () => {
      cancelled = true
    }
  }, [modelId])

  async function install() {
    setInstallState({ kind: 'installing', progress: { progress: 0, timeElapsed: 0, text: '모델을 준비하고 있어요' } })

    try {
      const nextEngine = await createWebLLMEngine({
        modelId,
        onProgress: (report) => setInstallState({ kind: 'installing', progress: report }),
      })

      setEngine(nextEngine)
      loadedModelIdRef.current = modelId
      setInstallState({ kind: 'installed' })
    } catch (error) {
      setInstallState({
        kind: 'error',
        message: error instanceof Error ? error.message : '모델을 설치하지 못했어요',
      })
    }
  }

  async function ensureEngine() {
    const existing = engineRef.current
    if (existing) {
      // Avoid reloading the model on every message.
      // Reload only when the selected model actually changed.
      if (loadedModelIdRef.current !== modelId) {
        existing.setAppConfig(buildWebLLMAppConfig(customModels))
        await existing.reload(modelId)
        loadedModelIdRef.current = modelId
      }
      setInstallState({ kind: 'installed' })
      return existing
    }

    const nextEngine = await createWebLLMEngine({
      modelId,
      onProgress: (report) => setInstallState({ kind: 'installing', progress: report }),
    })

    setEngine(nextEngine)
    loadedModelIdRef.current = modelId
    setInstallState({ kind: 'installed' })
    return nextEngine
  }

  async function removeInstalledModel() {
    await deleteInstalledModel(modelId)
    await engineRef.current?.unload().catch(() => {})
    setEngine(null)
    loadedModelIdRef.current = null
    await refreshInstallState()
  }

  function interruptGenerate() {
    engineRef.current?.interruptGenerate()
  }

  function resetChat() {
    engineRef.current?.resetChat()
  }

  return {
    engine,
    engineRef,
    ensureEngine,
    install,
    installState,
    interruptGenerate,
    isAutoModelEnabled,
    isThinkingEnabled,
    modelId,
    modelContextWindowSize,
    modelPreset,
    modelPresets,
    refreshInstallState,
    removeInstalledModel,
    resetChat,
    addCustomModel,
    customModels,
    setIsAutoModelEnabled,
    setIsThinkingEnabled,
    setModelId,
    setShowThinkingTrace,
    showThinkingTrace,
    removeCustomModel,
  }
}

async function getModelInstallState(
  modelId: ModelId,
): Promise<Extract<InstallState, { kind: 'error' | 'installed' | 'not-installed' }>> {
  const installed = await hasInstalledModel(modelId).catch(() => null)
  if (installed === null) {
    return { kind: 'error', message: '모델 상태를 확인하지 못했어요' }
  }
  return installed ? { kind: 'installed' } : { kind: 'not-installed' }
}
