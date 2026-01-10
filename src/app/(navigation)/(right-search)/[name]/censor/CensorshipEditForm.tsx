import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'

import type { PATCHV1CensorshipUpdateResponse } from '@/backend/api/v1/censorship/PATCH'

import { QueryKeys } from '@/constants/query'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

import { CENSORSHIP_LEVEL_LABELS } from './constants'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Props = {
  censorship: {
    id: number
    key: CensorshipKey
    value: string
    level: CensorshipLevel
  }
  onEditCompleted: () => void
}

export default function CensorshipEditForm({ censorship, onEditCompleted }: Readonly<Props>) {
  const { id, key, value, level } = censorship
  const queryClient = useQueryClient()
  const inputId = useId()
  const [editValue, setEditValue] = useState(value)
  const [editLevel, setEditLevel] = useState(level)

  const updateMutation = useMutation({
    mutationFn: async (items: { id: number; key: CensorshipKey; value: string; level: CensorshipLevel }[]) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/censorship`
      const { data } = await fetchWithErrorHandling<PATCHV1CensorshipUpdateResponse>(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      return data.ids
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.censorship })
      toast.success('검열 규칙을 수정했어요')
      onEditCompleted()
    },
  })

  function handleCancelEdit() {
    setEditValue(value)
    setEditLevel(level)
    onEditCompleted()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    updateMutation.mutate([{ id, key, value: editValue, level: editLevel }])
  }

  return (
    <form className="p-4 bg-zinc-800 rounded-lg border-2 border-brand" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor={inputId}>
            값
          </label>
          <input
            autoCapitalize="off"
            autoFocus
            className="w-full px-3 py-2 bg-zinc-700 rounded border-2 focus:border-zinc-500 outline-none transition"
            id={inputId}
            onChange={(e) => setEditValue(e.target.value)}
            required
            type="text"
            value={editValue}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">수준</label>
          <div className="flex gap-2">
            {Object.entries(CENSORSHIP_LEVEL_LABELS).map(([level, { label }]) => {
              const levelNum = Number(level) as CensorshipLevel
              return (
                <button
                  aria-pressed={editLevel === levelNum}
                  className="flex-1 px-3 py-2 rounded border-2 transition bg-zinc-700 hover:bg-zinc-600 aria-pressed:bg-zinc-600 aria-pressed:border-brand"
                  key={level}
                  onClick={() => setEditLevel(levelNum)}
                  type="button"
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
            disabled={updateMutation.isPending}
            onClick={handleCancelEdit}
            type="button"
          >
            취소
          </button>
          <button
            className="flex-1 px-3 py-2 font-semibold bg-brand/80 text-background hover:bg-brand/90 rounded transition flex items-center justify-center gap-1 disabled:opacity-50"
            disabled={updateMutation.isPending || !editValue.trim() || (editValue === value && editLevel === level)}
            type="submit"
          >
            {updateMutation.isPending ? (
              <span>저장 중...</span>
            ) : (
              <>
                <Check className="size-4" />
                <span>저장</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
