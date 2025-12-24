import { useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import useServerAction from '@/hook/useServerAction'

import { updateCensorships } from './action'
import { CENSORSHIP_LEVEL_LABELS } from './constants'

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
  const [editValue, setEditValue] = useState(value)
  const [editLevel, setEditLevel] = useState(level)

  const [response, dispatchAction, isPending] = useServerAction({
    action: updateCensorships,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.censorship })
      toast.success('검열 규칙을 수정했어요')
      onEditCompleted()
    },
  })

  // const defaultEditValue = getFormField(response, 'value')
  // const defaultEditLevel = getFormField(response, 'level')

  const handleCancelEdit = useCallback(() => {
    setEditValue(value)
    setEditLevel(level)
    onEditCompleted()
  }, [value, level, onEditCompleted])

  return (
    <form action={dispatchAction} className="p-4 bg-zinc-800 rounded-lg border-2 border-brand">
      <input name="id" type="hidden" value={id} />
      <input name="key" type="hidden" value={key} />
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor={`value-${id}`}>
            값
          </label>
          <input
            autoCapitalize="off"
            autoFocus
            className="w-full px-3 py-2 bg-zinc-700 rounded border-2 focus:border-zinc-500 outline-none transition"
            id={`value-${id}`}
            name="value"
            onChange={(e) => setEditValue(e.target.value)}
            required
            type="text"
            value={editValue}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor={`level-${id}`}>
            수준
          </label>
          <input id={`level-${id}`} name="level" type="hidden" value={editLevel} />
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
            disabled={isPending}
            onClick={handleCancelEdit}
            type="button"
          >
            취소
          </button>
          <button
            className="flex-1 px-3 py-2 font-semibold bg-brand/80 text-background hover:bg-brand/90 rounded transition flex items-center justify-center gap-1 disabled:opacity-50"
            disabled={isPending || !editValue.trim() || (editValue === value && editLevel === level)}
            type="submit"
          >
            {isPending ? (
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
