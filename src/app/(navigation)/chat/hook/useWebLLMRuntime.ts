'use client'

import { useEffect, useRef, useState } from 'react'

import {
  createWebLLMEngine,
  DEFAULT_MODEL_ID,
  deleteInstalledModel,
  hasInstalledModel,
  type InitProgressReport,
  MODEL_PRESETS,
  type SupportedModelId,
  type WebLLMEngine,
} from '../lib/webllm'

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

type ModelPreset = (typeof MODEL_PRESETS)[number]

type SetStateAction<T> = T | ((prev: T) => T)

export function useWebLLMRuntime(options: { enabled: boolean }) {
  const { enabled } = options

  const [isAutoModelEnabled, setIsAutoModelEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(AUTO_MODEL_ENABLED_STORAGE_KEY) !== 'false'
  })

  const [manualModelId, setManualModelIdState] = useState<SupportedModelId>(() => {
    if (typeof window === 'undefined') return DEFAULT_MODEL_ID
    const saved = window.localStorage.getItem(MODEL_ID_STORAGE_KEY)
    const found = MODEL_PRESETS.find((p) => p.modelId === saved)
    return found?.modelId ?? DEFAULT_MODEL_ID
  })

  const [recommendedModelId] = useState<SupportedModelId>(() => {
    if (typeof window === 'undefined') return DEFAULT_MODEL_ID
    return recommendModelId()
  })

  const modelId: SupportedModelId = isAutoModelEnabled ? recommendedModelId : manualModelId

  const [isThinkingEnabled, setIsThinkingEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(THINKING_ENABLED_STORAGE_KEY) === 'true'
  })

  const [showThinkingTrace, setShowThinkingTraceState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SHOW_THINKING_TRACE_STORAGE_KEY) === 'true'
  })

  const modelPreset = MODEL_PRESETS.find((p) => p.modelId === modelId) ?? MODEL_PRESETS[0]

  const [engine, setEngine, engineRef] = useStateWithRef<WebLLMEngine | null>(null)
  const loadedModelIdRef = useRef<SupportedModelId | null>(null)
  const [installState, setInstallState] = useState<InstallState>({ kind: 'unknown' })
  const [isWebGpuReady, setIsWebGpuReady] = useState<boolean | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const controller = new AbortController()

    void (async () => {
      const supported = await isWebGpuSupported()
      if (controller.signal.aborted) {
        return
      }
      setIsWebGpuReady(supported)
    })().catch(() => {})

    return () => controller.abort()
  }, [enabled])

  function setIsAutoModelEnabled(nextEnabled: boolean) {
    setIsAutoModelEnabledState(nextEnabled)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTO_MODEL_ENABLED_STORAGE_KEY, String(nextEnabled))
    }
  }

  function setModelId(nextModelId: SupportedModelId) {
    setIsAutoModelEnabledState(false)
    setManualModelIdState(nextModelId)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODEL_ID_STORAGE_KEY, nextModelId)
      window.localStorage.setItem(AUTO_MODEL_ENABLED_STORAGE_KEY, 'false')
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
    if (!enabled) return
    if (isWebGpuReady !== true) return

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
  }, [enabled, isWebGpuReady, modelId])

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
    void engineRef.current?.resetChat()
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
    isWebGpuReady,
    modelId,
    modelPreset,
    modelPresets: MODEL_PRESETS,
    recommendedModelId,
    refreshInstallState,
    removeInstalledModel,
    resetChat,
    setIsAutoModelEnabled,
    setIsThinkingEnabled,
    setModelId,
    setShowThinkingTrace,
    showThinkingTrace,
  }
}

function estimateVramBudgetGb(): number {
  const isMobile = isProbablyMobile()
  const deviceMemoryGb = getDeviceMemoryGb()

  if (deviceMemoryGb === null) {
    return isMobile ? 1.4 : 5.1
  }

  return Math.max(1.4, deviceMemoryGb)
}

function getDeviceMemoryGb(): number | null {
  if (typeof navigator === 'undefined') return null
  const raw = (navigator as { deviceMemory?: unknown }).deviceMemory
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) {
    return null
  }
  return raw
}

async function getModelInstallState(
  modelId: SupportedModelId,
): Promise<Extract<InstallState, { kind: 'error' | 'installed' | 'not-installed' }>> {
  const installed = await hasInstalledModel(modelId).catch(() => null)
  if (installed === null) {
    return { kind: 'error', message: '모델 상태를 확인하지 못했어요' }
  }
  return installed ? { kind: 'installed' } : { kind: 'not-installed' }
}

function isProbablyMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  const uad = (navigator as { userAgentData?: unknown }).userAgentData
  if (uad && typeof uad === 'object' && 'mobile' in uad) {
    const mobile = (uad as { mobile?: unknown }).mobile
    if (typeof mobile === 'boolean') return mobile
  }

  const ua = navigator.userAgent
  return /Android|iPhone|iPad|iPod/i.test(ua)
}

async function isWebGpuSupported(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false
  if (!('gpu' in navigator)) return false

  try {
    const gpu = (navigator as { gpu?: unknown }).gpu
    if (!gpu || typeof gpu !== 'object') return false
    if (!('requestAdapter' in gpu)) return false
    const requestAdapter = (gpu as { requestAdapter?: unknown }).requestAdapter
    if (typeof requestAdapter !== 'function') return false

    const adapter = await (gpu as { requestAdapter: () => Promise<unknown> }).requestAdapter()
    return Boolean(adapter)
  } catch {
    return false
  }
}

function pickLargestWithinBudget(presets: readonly ModelPreset[], budgetGb: number): ModelPreset | null {
  let best: ModelPreset | null = null
  for (const preset of presets) {
    if (preset.requiredVramGb > budgetGb) continue
    if (!best || preset.requiredVramGb > best.requiredVramGb) {
      best = preset
    }
  }
  return best
}

function recommendModelId(): SupportedModelId {
  // NOTE:
  // WebGPU does not expose real VRAM size for privacy reasons, so this is a heuristic.
  // We pick the largest preset that should fit within the estimated budget.
  const budgetGb = estimateVramBudgetGb()

  const best = pickLargestWithinBudget(MODEL_PRESETS, budgetGb)
  return (best ?? MODEL_PRESETS[0]).modelId
}

function useStateWithRef<T>(initial: T | (() => T)) {
  const [state, setState] = useState<T>(initial)
  const ref = useRef(state)

  function set(action: SetStateAction<T>) {
    setState((prev) => {
      const next = typeof action === 'function' ? (action as (p: T) => T)(prev) : action
      ref.current = next
      return next
    })
  }

  return [state, set, ref] as const
}
