'use client'

import { useState, useTransition } from 'react'

import IconPlus from '@/components/icons/IconPlus'
import IconX from '@/components/icons/IconX'
import Modal from '@/components/ui/Modal'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'

import { CENSORSHIP_KEY_LABELS } from './constants'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => void
}

const CENSORSHIP_LEVEL_LABELS: Record<CensorshipLevel, { label: string; description: string }> = {
  [CensorshipLevel.LIGHT]: {
    label: '흐리게',
    description: '썸네일을 흐리게',
  },
  [CensorshipLevel.HEAVY]: {
    label: '숨김',
    description: '카드 전체를 숨김',
  },
  [CensorshipLevel.NONE]: {
    label: '해제',
    description: '검열을 해제함',
  },
}

export default function AddCensorshipModal({ open, onClose, onSubmit }: Readonly<Props>) {
  const [key, setKey] = useState<CensorshipKey>(CensorshipKey.TAG)
  const [value, setValue] = useState('')
  const [level, setLevel] = useState<CensorshipLevel>(CensorshipLevel.LIGHT)
  const [suggestions] = useState<string[]>([]) // TODO: Add tag/artist suggestions
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!value.trim()) {
      return
    }

    const formData = new FormData()
    formData.append('key', key.toString())
    formData.append('value', value.trim())
    formData.append('level', level.toString())

    startTransition(() => {
      onSubmit(formData)
      setValue('')
      setLevel(CensorshipLevel.LIGHT)
    })
  }

  return (
    <Modal
      className="fixed inset-0 z-[70] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
        sm:w-full sm:max-w-lg sm:max-h-[calc(100dvh-4rem)]
        bg-zinc-900 sm:border-2 sm:border-zinc-700 sm:rounded-xl flex flex-col overflow-hidden"
      onClose={onClose}
      open={open}
    >
      <form className="flex flex-col h-full min-h-0" onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b-2 border-zinc-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-zinc-100">검열 규칙 추가</h2>
          <button
            className="p-2 -mr-2 rounded-lg hover:bg-zinc-800 transition sm:p-1.5 sm:-mr-1.5"
            onClick={onClose}
            type="button"
          >
            <IconX className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">유형</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CENSORSHIP_KEY_LABELS).map(([k, label]) => (
                <button
                  aria-pressed={key === Number(k)}
                  className="p-3 rounded-lg border-2 transition aria-pressed:bg-zinc-700 aria-pressed:border-brand-end aria-pressed:text-zinc-100 aria-pressed:hover:bg-zinc-700 aria-pressed:hover:text-zinc-300
                    border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isPending}
                  key={k}
                  onClick={() => setKey(Number(k) as CensorshipKey)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{CENSORSHIP_KEY_LABELS[key]} 이름</label>
            <input
              autoFocus
              className="w-full px-4 py-2 bg-zinc-800 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 outline-none transition text-zinc-100 placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPending}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`검열할 ${CENSORSHIP_KEY_LABELS[key]}를 입력하세요`}
              type="text"
              value={value}
            />
            {suggestions.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto bg-zinc-800 rounded-lg border-2 border-zinc-700">
                {suggestions.map((suggestion) => (
                  <button
                    className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition"
                    key={suggestion}
                    onClick={() => setValue(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Level Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">검열 수준</label>
            <div className="space-y-2">
              {Object.entries(CENSORSHIP_LEVEL_LABELS).map(([l, { label, description }]) => (
                <button
                  aria-pressed={level === Number(l)}
                  className="w-full p-4 rounded-lg border-2 text-left transition aria-pressed:bg-zinc-700 aria-pressed:border-brand-end aria-pressed:text-zinc-100 aria-pressed:hover:bg-zinc-700 aria-pressed:hover:text-zinc-300
                    border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isPending}
                  key={l}
                  onClick={() => setLevel(Number(l) as CensorshipLevel)}
                  type="button"
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-zinc-400">{description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-zinc-900 border-t-2 border-zinc-800 flex gap-2 flex-shrink-0">
          <button
            className="flex-1 px-4 py-3 text-zinc-300 font-medium bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg transition"
            onClick={onClose}
            type="button"
          >
            취소
          </button>
          <button
            className="flex-1 px-4 py-3 text-zinc-900 font-semibold bg-brand-end hover:bg-brand-end/90 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg transition flex items-center justify-center gap-2"
            disabled={!value.trim() || isPending}
            type="submit"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                <span>추가 중...</span>
              </>
            ) : (
              <>
                <IconPlus className="w-5 h-5" />
                <span>추가</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
