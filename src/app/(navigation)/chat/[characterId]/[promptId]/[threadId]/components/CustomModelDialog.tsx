import { FormEvent, useRef } from 'react'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'

interface CustomModelDialogProps {
  onClose: () => void
  onSubmit: (formData: FormData) => void
  open: boolean
}

export function CustomModelDialog({ open, onClose, onSubmit }: CustomModelDialogProps) {
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(new FormData(event.currentTarget))
  }

  function handleAfterClose() {
    formRef.current?.reset()
  }

  return (
    <Dialog ariaLabel="커스텀 모델 추가" onAfterClose={handleAfterClose} onClose={onClose} open={open}>
      <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit} ref={formRef}>
        <DialogHeader onClose={onClose} title="커스텀 모델 추가" />
        <DialogBody className="flex flex-col gap-3 text-sm">
          <p className="text-xs text-zinc-500">
            WebLLM은 <span className="text-zinc-300">MLC 포맷 가중치</span> +{' '}
            <span className="text-zinc-300">model_lib(wasm)</span>이 필요해요
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-medium" htmlFor="custom-model-label">
                이름
              </label>
              <input
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
                id="custom-model-label"
                name="label"
                placeholder="예: 14B · 12GB"
                required
                type="text"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-medium" htmlFor="custom-model-vram">
                VRAM(GB) (선택)
              </label>
              <input
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm tabular-nums"
                id="custom-model-vram"
                min={0}
                name="required-vram-gb"
                placeholder="예: 12"
                step={0.1}
                type="number"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 font-medium" htmlFor="custom-model-id">
              model_id
            </label>
            <input
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm tabular-nums"
              id="custom-model-id"
              name="model-id"
              placeholder="예: Qwen2.5-14B-Instruct-q4f16_1-MLC"
              required
              type="text"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 font-medium" htmlFor="custom-model-url">
              HuggingFace URL (MLC 가중치)
            </label>
            <input
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm tabular-nums"
              id="custom-model-url"
              name="model-url"
              placeholder="예: https://huggingface.co/mlc-ai/..."
              required
              type="text"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 font-medium" htmlFor="custom-model-lib-url">
              model_lib URL (wasm)
            </label>
            <input
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm tabular-nums"
              id="custom-model-lib-url"
              name="model-lib-url"
              placeholder="예: https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/..."
              required
              type="text"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 font-medium" htmlFor="custom-model-description">
              설명 (선택)
            </label>
            <input
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              id="custom-model-description"
              name="description"
              placeholder="예: 캐릭터 롤플레이용"
              type="text"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input className="accent-brand" name="supports-thinking" type="checkbox" />
            생각하기 지원
          </label>
        </DialogBody>
        <DialogFooter className="flex gap-2">
          <button
            className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl border border-zinc-700 hover:border-zinc-500 transition text-zinc-200"
            onClick={onClose}
            type="button"
          >
            취소
          </button>
          <button
            className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white transition"
            type="submit"
          >
            추가하기
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
