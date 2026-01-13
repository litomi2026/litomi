'use client'

import { Download } from 'lucide-react'

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
  mode: 'chat' | 'thinking'
}

type Props = {
  installState: InstallState
  isLocked: boolean
  isThinkingEnabled: boolean
  modelId: SupportedModelId
  modelPreset: ModelPreset
  modelPresets: readonly ModelPreset[]
  onChangeModelId: (modelId: SupportedModelId) => void
  onChangeThinkingEnabled: (enabled: boolean) => void
  onInstall: () => void
  onRefreshInstallState: () => void
  onRemoveInstalledModel: () => void
}

export function ModelPanel({
  installState,
  isLocked,
  isThinkingEnabled,
  modelId,
  modelPreset,
  modelPresets,
  onChangeModelId,
  onChangeThinkingEnabled,
  onInstall,
  onRefreshInstallState,
  onRemoveInstalledModel,
}: Props) {
  const isSelectDisabled = isLocked || installState.kind === 'installing'

  return (
    <section className="rounded-2xl border border-zinc-800/60 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">모델</p>
        {installState.kind === 'installed' ? (
          <button
            className="text-sm text-zinc-300 underline hover:text-zinc-100 transition"
            onClick={onRemoveInstalledModel}
            type="button"
          >
            삭제
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="model-preset">
          모델 프리셋
        </label>
        <select
          aria-disabled={isSelectDisabled}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm tabular-nums aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
          disabled={isSelectDisabled}
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
        <p className="text-xs text-zinc-500">표기한 용량은 대략 필요한 GPU 메모리(VRAM)예요</p>
        {modelPreset.mode === 'thinking' ? (
          <p className="text-xs text-zinc-500">답변을 만들기 전에 잠깐 생각 중으로 표시될 수 있어요</p>
        ) : null}
        {modelPreset.mode === 'thinking' ? (
          <label className="flex items-center justify-between gap-3 mt-1">
            <span className="text-xs text-zinc-500">생각 과정 생성(고급)</span>
            <input
              checked={isThinkingEnabled}
              className="size-4"
              id="thinking-enabled"
              name="thinking-enabled"
              onChange={(e) => onChangeThinkingEnabled(e.target.checked)}
              type="checkbox"
            />
          </label>
        ) : null}
        {isLocked ? <p className="text-xs text-zinc-500">대화가 시작된 뒤에는 모델을 바꿀 수 없어요</p> : null}
      </div>

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
          <p className="text-sm text-zinc-400">{installState.progress.text}</p>
          <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
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
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-700/60 hover:border-zinc-500 transition"
            onClick={onRefreshInstallState}
            type="button"
          >
            다시 확인
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">설치됐어요</p>
      )}
    </section>
  )
}
