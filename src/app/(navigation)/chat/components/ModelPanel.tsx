'use client'

import { ChevronRight, Download, Trash2 } from 'lucide-react'

import Toggle from '@/components/ui/Toggle'

import type { InitProgressReport, SupportedModelId } from '../lib/webllm'

type InstallState =
  | { kind: 'error'; message: string }
  | { kind: 'installed' }
  | { kind: 'installing'; progress: InitProgressReport }
  | { kind: 'not-installed' }
  | { kind: 'unknown' }

type ModelPreset = {
  label: string
  description: string
  modelId: SupportedModelId
  supportsThinking: boolean
  requiredVramGb: number
}

type Props = {
  installState: InstallState
  isAutoModelEnabled: boolean
  isLocked: boolean
  isThinkingEnabled: boolean
  modelId: SupportedModelId
  modelPreset: ModelPreset
  modelPresets: readonly ModelPreset[]
  recommendedModelId: SupportedModelId
  showThinkingTrace: boolean
  onChangeAutoModelEnabled: (enabled: boolean) => void
  onChangeModelId: (modelId: SupportedModelId) => void
  onChangeThinkingEnabled: (enabled: boolean) => void
  onChangeThinkingTraceVisible: (enabled: boolean) => void
  onInstall: () => void
  onRefreshInstallState: () => void
  onRemoveInstalledModel: () => void
}

export function ModelPanel({
  installState,
  isAutoModelEnabled,
  isLocked,
  isThinkingEnabled,
  modelId,
  modelPreset,
  modelPresets,
  recommendedModelId,
  showThinkingTrace,
  onChangeAutoModelEnabled,
  onChangeModelId,
  onChangeThinkingEnabled,
  onChangeThinkingTraceVisible,
  onInstall,
  onRefreshInstallState,
  onRemoveInstalledModel,
}: Props) {
  const isAdvancedDisabled = isLocked || installState.kind === 'installing'
  const recommendedPreset = modelPresets.find((p) => p.modelId === recommendedModelId)
  const statusText = getInstallStatusText(installState)

  return (
    <section className="rounded-2xl border border-white/7 bg-white/3 p-4 flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <p className="text-sm font-medium">AI 모델</p>
          <p className="text-xs text-zinc-500">{statusText}</p>
        </div>
      </div>

      <details className="group rounded-xl border border-white/7 bg-white/2">
        <summary className="cursor-pointer list-none px-3 py-2 flex items-center gap-2 text-sm text-zinc-300 [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 text-zinc-500 transition-transform group-open:rotate-90" />
          <span className="font-medium">고급 설정</span>
          {isLocked ? <span className="ml-auto text-xs text-zinc-500">대화 중에는 잠겨요</span> : null}
        </summary>
        <div className="px-3 pb-3 pt-1 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <p className="text-xs text-zinc-400 font-medium">모델 자동 추천</p>
              <p className="text-xs text-zinc-500">내 기기 성능에 맞춰 자동으로 골라요</p>
            </div>
            <Toggle
              aria-label="모델 자동 추천"
              checked={isAutoModelEnabled}
              className="w-10 peer-checked:bg-brand/65 peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0"
              disabled={isAdvancedDisabled}
              onToggle={onChangeAutoModelEnabled}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400 font-medium" htmlFor="model-preset">
              모델 프리셋
            </label>
            <select
              aria-disabled={isAdvancedDisabled || isAutoModelEnabled}
              className="bg-white/2 border border-white/7 rounded-xl px-3 py-2 text-sm tabular-nums aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
              disabled={isAdvancedDisabled || isAutoModelEnabled}
              id="model-preset"
              name="model-preset"
              onChange={(e) => onChangeModelId(e.target.value as SupportedModelId)}
              value={modelId}
            >
              {modelPresets.map((p) => (
                <option key={p.modelId} value={p.modelId}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">{modelPreset.description}</p>
            <p className="text-xs text-zinc-500">표기된 숫자는 "모델 파라미터 수 · 필요한 GPU 메모리(VRAM)"예요</p>
            {!isAutoModelEnabled && recommendedPreset ? (
              <p className="text-xs text-zinc-500">
                추천: {recommendedPreset.label} (약 {recommendedPreset.requiredVramGb}GB)
              </p>
            ) : null}
          </div>

          {modelPreset.supportsThinking ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-400 font-medium">생각하기</p>
                <Toggle
                  aria-label="생각하기"
                  checked={isThinkingEnabled}
                  className="w-10 peer-checked:bg-brand/65 peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0"
                  disabled={isAdvancedDisabled}
                  onToggle={onChangeThinkingEnabled}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-400 font-medium">생각 과정 보기</p>
                <Toggle
                  aria-label="생각 과정 보기"
                  checked={showThinkingTrace}
                  className="w-10 peer-checked:bg-brand/65 peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0"
                  disabled={isAdvancedDisabled || !isThinkingEnabled}
                  onToggle={onChangeThinkingTraceVisible}
                />
              </div>
            </div>
          ) : null}

          {installState.kind === 'installed' ? (
            <button
              aria-disabled={isAdvancedDisabled}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/7 hover:border-white/15 transition aria-disabled:opacity-50 aria-disabled:pointer-events-none text-zinc-200"
              onClick={onRemoveInstalledModel}
              type="button"
            >
              <Trash2 className="size-4 text-zinc-400" />
              모델 삭제
            </button>
          ) : null}
        </div>
      </details>

      {installState.kind === 'unknown' ? (
        <p className="text-sm text-zinc-500">모델 상태를 확인하고 있어요…</p>
      ) : installState.kind === 'not-installed' ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">처음 한 번만 내려받으면 돼요</p>
          <button
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white transition"
            onClick={onInstall}
            type="button"
          >
            <Download className="size-4" />
            설치하기
          </button>
        </div>
      ) : installState.kind === 'installing' ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-400 tabular-nums">{installState.progress.text}</p>
          <div className="h-2 rounded-full bg-white/7 overflow-hidden">
            <div
              className="h-2 bg-brand transition-[width] duration-200"
              style={{ width: `${installState.progress.progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 tabular-nums">
            {(installState.progress.progress * 100).toFixed(1)}% · {Math.round(installState.progress.timeElapsed)}초
          </p>
        </div>
      ) : installState.kind === 'error' ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-red-300">{installState.message}</p>
          <button
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/7 hover:border-white/15 transition"
            onClick={onRefreshInstallState}
            type="button"
          >
            다시 확인
          </button>
        </div>
      ) : null}
    </section>
  )
}

function getInstallStatusText(state: InstallState): string {
  if (state.kind === 'installed') return '준비됐어요'
  if (state.kind === 'installing') return '설치 중이에요'
  if (state.kind === 'not-installed') return '설치가 필요해요'
  if (state.kind === 'error') return '문제가 생겼어요'
  return '모델 상태를 확인하고 있어요…'
}
