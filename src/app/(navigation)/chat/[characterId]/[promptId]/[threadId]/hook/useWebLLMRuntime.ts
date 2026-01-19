'use client'

import type { InitProgressReport, WebWorkerMLCEngine } from '@mlc-ai/web-llm'

import { useEffect, useMemo, useRef, useState } from 'react'

import { buildWebLLMAppConfig, type EngineModelInput } from '../../../../lib/webllmAppConfig'
import { deleteInstalledModel, hasInstalledModel } from '../../../../lib/webllmCache'
import { createWebLLMEngine } from '../../../../lib/webllmEngine'
import { DEFAULT_MODEL_ID, type ModelId, RESOLVED_MODEL_PRESETS } from '../../../../lib/webllmModel'
import { useWebLLMSettingsStore } from '../../../../storage/webllmSettingsStore'
import { recommendModelIdFromNavigator } from '../../../../util/modelRecommendation'
import { useStateWithRef } from './useStateWithRef'

type InstallState =
  | { kind: 'error'; message: string }
  | { kind: 'installed' }
  | { kind: 'installing'; progress: InitProgressReport }
  | { kind: 'not-installed' }
  | { kind: 'unknown' }

type SelectableModel = {
  label: string
  descriptionName: string
  modelId: ModelId
  supportsThinking: boolean
  requiredVramMb?: number
  contextWindowSize?: number
}

export function useWebLLMRuntime() {
  const {
    customModels,
    contextWindowPercent,
    isAutoModelEnabled,
    isThinkingEnabled,
    manualModelId,
    setContextWindowPercent,
    setIsAutoModelEnabled,
    setIsThinkingEnabled,
    setModelId,
    setShowThinkingTrace,
    showThinkingTrace,
    addCustomModel,
    removeCustomModel,
  } = useWebLLMSettingsStore()

  const recommendablePresets = RESOLVED_MODEL_PRESETS.flatMap((p) =>
    p.requiredVramMb ? [{ modelId: p.modelId, requiredVramGb: p.requiredVramMb / 1024 }] : [],
  )

  const recommendedModelId: ModelId =
    recommendablePresets.length > 0 ? recommendModelIdFromNavigator(recommendablePresets) : DEFAULT_MODEL_ID

  const modelId: ModelId = isAutoModelEnabled ? recommendedModelId : manualModelId

  // The engine config is derived from settings. Keep a stable reference so we can safely depend on it in Effects.
  const engineCustomModels: readonly EngineModelInput[] = useMemo(
    () =>
      customModels.map((m) => ({
        modelId: m.modelId,
        modelUrl: m.modelUrl,
        modelLibUrl: m.modelLibUrl,
        requiredVramMb: m.requiredVramMb,
        contextWindowSize: m.contextWindowSize,
      })),
    [customModels],
  )
  const appConfig = useMemo(
    () => buildWebLLMAppConfig({ customModels: engineCustomModels, contextWindowPercent }),
    [engineCustomModels, contextWindowPercent],
  )
  const model = appConfig.model_list.find((m) => m.model_id === modelId)
  const modelContextWindowSize = model?.overrides?.context_window_size

  const modelPresets: readonly SelectableModel[] = [
    ...RESOLVED_MODEL_PRESETS.map((p) => ({
      label: p.label,
      descriptionName: p.modelId.replaceAll('-', ' '),
      modelId: p.modelId,
      supportsThinking: p.supportsThinking,
      requiredVramMb: p.requiredVramMb,
      contextWindowSize: p.contextWindowSize,
    })),
    ...customModels.map((m) => ({
      label: m.label,
      descriptionName: m.description || '커스텀 모델이에요',
      modelId: m.modelId,
      supportsThinking: m.supportsThinking,
      requiredVramMb: m.requiredVramMb,
      contextWindowSize: m.contextWindowSize,
    })),
  ]

  const modelPreset = modelPresets.find((p) => p.modelId === modelId) ?? modelPresets[0]

  const [engine, setEngine, engineRef] = useStateWithRef<WebWorkerMLCEngine | null>(null)
  const loadedModelIdRef = useRef<ModelId | null>(null)
  const [installState, setInstallState] = useState<InstallState>({ kind: 'unknown' })

  useEffect(() => {
    engineRef.current?.setAppConfig(appConfig)
  }, [appConfig, engineRef])

  async function refreshInstallState() {
    setInstallState({ kind: 'unknown' })
    setInstallState(await getModelInstallState({ modelId, appConfig }))
  }

  useEffect(() => {
    let cancelled = false
    setInstallState({ kind: 'unknown' })
    void (async () => {
      const next = await getModelInstallState({ modelId, appConfig })
      if (cancelled) return
      setInstallState(next)
    })()

    return () => {
      cancelled = true
    }
  }, [appConfig, modelId])

  async function install() {
    setInstallState({ kind: 'installing', progress: { progress: 0, timeElapsed: 0, text: '모델을 준비하고 있어요' } })

    try {
      const nextEngine = await createWebLLMEngine({
        modelId,
        appConfig,
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
      if (loadedModelIdRef.current !== modelId) {
        existing.setAppConfig(appConfig)
        await existing.reload(modelId)
        loadedModelIdRef.current = modelId
      }
      setInstallState({ kind: 'installed' })
      return existing
    }

    const nextEngine = await createWebLLMEngine({
      modelId,
      appConfig,
      onProgress: (report) => setInstallState({ kind: 'installing', progress: report }),
    })

    setEngine(nextEngine)
    loadedModelIdRef.current = modelId
    setInstallState({ kind: 'installed' })
    return nextEngine
  }

  async function removeInstalledModel() {
    await deleteInstalledModel(modelId, appConfig)
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
    contextWindowPercent,
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
    setContextWindowPercent,
    setIsThinkingEnabled,
    setModelId,
    setShowThinkingTrace,
    showThinkingTrace,
    removeCustomModel,
  }
}

async function getModelInstallState(args: {
  modelId: ModelId
  appConfig: ReturnType<typeof buildWebLLMAppConfig>
}): Promise<Extract<InstallState, { kind: 'error' | 'installed' | 'not-installed' }>> {
  const installed = await hasInstalledModel(args.modelId, args.appConfig).catch(() => null)
  if (installed === null) {
    return { kind: 'error', message: '모델 상태를 확인하지 못했어요' }
  }
  return installed ? { kind: 'installed' } : { kind: 'not-installed' }
}
