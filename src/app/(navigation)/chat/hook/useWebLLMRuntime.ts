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
const THINKING_ENABLED_STORAGE_KEY = 'litomi:character-chat:thinking-enabled'

type InstallState =
  | { kind: 'error'; message: string }
  | { kind: 'installed' }
  | { kind: 'installing'; progress: InitProgressReport }
  | { kind: 'not-installed' }
  | { kind: 'unknown' }

type SetStateAction<T> = T | ((prev: T) => T)

export function useWebLLMRuntime(options: { enabled: boolean }) {
  const { enabled } = options

  const [isThinkingEnabled, setIsThinkingEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(THINKING_ENABLED_STORAGE_KEY) !== 'false'
  })

  const [modelId, setModelIdState] = useState<SupportedModelId>(() => {
    if (typeof window === 'undefined') return DEFAULT_MODEL_ID
    const saved = window.localStorage.getItem(MODEL_ID_STORAGE_KEY)
    const found = MODEL_PRESETS.find((p) => p.modelId === saved)
    return found?.modelId ?? DEFAULT_MODEL_ID
  })

  const modelPreset = MODEL_PRESETS.find((p) => p.modelId === modelId) ?? MODEL_PRESETS[0]

  const [engine, setEngine, engineRef] = useStateWithRef<WebLLMEngine | null>(null)

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

  function setModelId(nextModelId: SupportedModelId) {
    setModelIdState(nextModelId)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODEL_ID_STORAGE_KEY, nextModelId)
    }
  }

  function setIsThinkingEnabled(nextEnabled: boolean) {
    setIsThinkingEnabledState(nextEnabled)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THINKING_ENABLED_STORAGE_KEY, String(nextEnabled))
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
      await existing.reload(modelId)
      return existing
    }

    const nextEngine = await createWebLLMEngine({
      modelId,
      onProgress: (report) => setInstallState({ kind: 'installing', progress: report }),
    })
    setEngine(nextEngine)
    return nextEngine
  }

  async function removeInstalledModel() {
    await deleteInstalledModel(modelId)
    await engineRef.current?.unload().catch(() => {})
    setEngine(null)
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
    isThinkingEnabled,
    isWebGpuReady,
    modelId,
    modelPreset,
    modelPresets: MODEL_PRESETS,
    refreshInstallState,
    removeInstalledModel,
    resetChat,
    setIsThinkingEnabled,
    setModelId,
  }
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
