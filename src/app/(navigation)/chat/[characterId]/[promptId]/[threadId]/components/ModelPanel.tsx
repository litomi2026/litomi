'use client'

import { ChevronRight, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'

import CustomSelect from '@/components/ui/CustomSelect'
import Toggle from '@/components/ui/Toggle'

import type { CustomWebLLMModel, ModelId } from '../../../../storage/webllmModels'

import { normalizeHuggingFaceUrl } from '../../../../util/huggingface'
import { CustomModelDialog } from './CustomModelDialog'
import { type InstallState, ModelStatus } from './ModelStatus'

type ModelPreset = {
  label: string
  description: string
  modelId: ModelId
  supportsThinking: boolean
  requiredVramGb?: number
}

type Props = {
  installState: InstallState
  isAutoModelEnabled: boolean
  isLocked: boolean
  isThinkingEnabled: boolean
  modelId: ModelId
  modelPreset: ModelPreset
  modelPresets: readonly ModelPreset[]
  showThinkingTrace: boolean
  customModels: readonly CustomWebLLMModel[]
  onChangeAutoModelEnabled: (enabled: boolean) => void
  onChangeModelId: (modelId: ModelId) => void
  onChangeThinkingEnabled: (enabled: boolean) => void
  onChangeThinkingTraceVisible: (enabled: boolean) => void
  onAddCustomModel: (model: CustomWebLLMModel) => { ok: false; message: string } | { ok: true }
  onRemoveCustomModel: (modelId: string) => void
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
  showThinkingTrace,
  customModels,
  onChangeAutoModelEnabled,
  onChangeModelId,
  onChangeThinkingEnabled,
  onChangeThinkingTraceVisible,
  onAddCustomModel,
  onRemoveCustomModel,
  onInstall,
  onRefreshInstallState,
  onRemoveInstalledModel,
}: Props) {
  const [isCustomModelDialogOpen, setIsCustomModelDialogOpen] = useState(false)
  const modelPresetId = useId()
  const isAdvancedDisabled = isLocked || installState.kind === 'installing'
  const isThinkingDisabled = isAdvancedDisabled || !modelPreset.supportsThinking
  const isThinkingTraceDisabled = isAdvancedDisabled || !isThinkingEnabled || !modelPreset.supportsThinking

  function handleCustomModelSubmit(fd: FormData) {
    const label = String(fd.get('label'))
    const modelId = String(fd.get('model-id'))
    const description = String(fd.get('description'))
    const modelUrl = normalizeHuggingFaceUrl(String(fd.get('model-url')))
    const modelLibUrl = String(fd.get('model-lib-url')).trim()
    const requiredVramGbRaw = String(fd.get('required-vram-gb')).trim()
    const requiredVramGb = requiredVramGbRaw ? Number(requiredVramGbRaw) : undefined
    const supportsThinking = fd.get('supports-thinking') === 'on'

    const result = onAddCustomModel({
      label,
      description,
      modelId,
      modelUrl,
      modelLibUrl,
      requiredVramGb,
      supportsThinking,
    })

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success('커스텀 모델을 추가했어요')
    setIsCustomModelDialogOpen(false)
  }

  return (
    <section className="rounded-2xl border border-white/7 bg-white/3 p-4 flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-sm font-medium">AI 모델</p>
      </div>

      <ModelStatus installState={installState} onInstall={onInstall} onRefreshInstallState={onRefreshInstallState} />

      <details className="group rounded-xl border border-white/7 bg-white/2">
        <summary className="cursor-pointer list-none px-3 py-2 flex items-center gap-2 text-sm text-zinc-300 [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 text-zinc-500 transition-transform group-open:rotate-90" />
          <span className="font-medium">설정</span>
          {isLocked ? <span className="ml-auto text-xs text-zinc-500">대화를 시작하면 변경할 수 없어요</span> : null}
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
            <label className="text-xs text-zinc-400 font-medium" htmlFor={modelPresetId}>
              모델 프리셋
            </label>
            <div className="flex items-center gap-2">
              <CustomSelect
                buttonClassName="text-sm tabular-nums"
                className="flex-1 min-w-0"
                disabled={isAdvancedDisabled || isAutoModelEnabled}
                id={modelPresetId}
                name="model-preset"
                onChange={(value) => onChangeModelId(value as ModelId)}
                options={modelPresets.map((p) => ({
                  value: p.modelId,
                  label: p.label,
                }))}
                value={modelId}
              />
              <button
                aria-disabled={isAdvancedDisabled || installState.kind !== 'installed'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/7 hover:border-white/15 transition aria-disabled:opacity-40 aria-disabled:pointer-events-none"
                onClick={onRemoveInstalledModel}
                type="button"
              >
                <Trash2 className="size-4 text-zinc-400" />
                <span className="sr-only">모델 삭제</span>
              </button>
            </div>
            <p className="text-xs text-zinc-500">{modelPreset.description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              aria-disabled={isThinkingDisabled}
              className="flex items-center justify-between gap-3 cursor-pointer select-none transition aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
            >
              <p className="text-xs text-zinc-400 font-medium">생각하기</p>
              <Toggle
                aria-label="생각하기"
                checked={isThinkingEnabled}
                className="w-10 peer-checked:bg-brand/65 peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0"
                disabled={isThinkingDisabled}
                onToggle={onChangeThinkingEnabled}
              />
            </label>
            <label
              aria-disabled={isThinkingTraceDisabled}
              className="flex items-center justify-between gap-3 cursor-pointer select-none transition aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
            >
              <p className="text-xs text-zinc-400 font-medium">생각 과정 보기</p>
              <Toggle
                aria-label="생각 과정 보기"
                checked={showThinkingTrace}
                className="w-10 peer-checked:bg-brand/65 peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0"
                disabled={isThinkingTraceDisabled}
                onToggle={onChangeThinkingTraceVisible}
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-400 font-medium">커스텀 모델</p>
              <button
                aria-disabled={isAdvancedDisabled}
                className="inline-flex text-sm items-center justify-center px-3 py-1.5 whitespace-nowrap rounded-xl border border-white/7 hover:border-white/15 transition aria-disabled:opacity-50 aria-disabled:pointer-events-none text-zinc-200"
                onClick={() => setIsCustomModelDialogOpen(true)}
                type="button"
              >
                추가하기
              </button>
            </div>

            {customModels.length > 0 && (
              <ul className="flex flex-col gap-2">
                {customModels.map((m) => (
                  <li
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/7 bg-white/2 px-3 py-2"
                    key={m.modelId}
                  >
                    <div className="min-w-0 flex flex-col">
                      <p className="text-sm text-zinc-200 truncate">{m.label}</p>
                      <p className="text-xs text-zinc-500 truncate tabular-nums">{m.modelId}</p>
                    </div>
                    <button
                      aria-disabled={isAdvancedDisabled}
                      className="inline-flex items-center justify-center rounded-lg border border-white/7 hover:border-white/15 transition aria-disabled:opacity-50 aria-disabled:pointer-events-none p-2"
                      onClick={() => {
                        onRemoveCustomModel(m.modelId)
                        toast.success('커스텀 모델을 삭제했어요')
                      }}
                      type="button"
                    >
                      <Trash2 className="size-4 text-zinc-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </details>

      <CustomModelDialog
        onClose={() => setIsCustomModelDialogOpen(false)}
        onSubmit={handleCustomModelSubmit}
        open={isCustomModelDialogOpen}
      />
    </section>
  )
}
