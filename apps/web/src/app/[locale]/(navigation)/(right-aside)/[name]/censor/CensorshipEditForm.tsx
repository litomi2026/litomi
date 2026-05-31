import type { PATCHV1CensorshipUpdateResponse } from '@litomi/contracts'

import { CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'
import { env } from '@litomi/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { toast } from 'sonner'

import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import { CENSORSHIP_LEVELS } from './constants'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Props = {
  censorship: {
    id: number
    key: CensorshipKey
    value: string
    level: CensorshipLevel
  }
  onEditCompleted: () => void
}

export default function CensorshipEditForm({ censorship, onEditCompleted }: Props) {
  const { id, key, value, level } = censorship
  const [editValue, setEditValue] = useState(value)
  const [editLevel, setEditLevel] = useState(level)
  const inputId = useId()
  const queryClient = useQueryClient()
  const t = useTranslations('Censorship')
  const { guardAdultAccess } = useAdultAccessGuard()

  const updateMutation = useMutation({
    mutationFn: async (items: { id: number; key: CensorshipKey; value: string; level: CensorshipLevel }[]) => {
      const url = new URL('/api/v1/censorship', NEXT_PUBLIC_API_ORIGIN)

      const { data } = await fetchAPIData<PATCHV1CensorshipUpdateResponse>(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      return data.ids
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.censorship })
      toast.success(t('editForm.successToast'))
      onEditCompleted()
    },
  })

  function handleCancelEdit() {
    setEditValue(value)
    setEditLevel(level)
    onEditCompleted()
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!guardAdultAccess()) {
      return
    }

    updateMutation.mutate([{ id, key, value: editValue, level: editLevel }])
  }

  return (
    <form className="border-y border-brand/60 bg-brand/5 p-4 sm:px-5" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300" htmlFor={inputId}>
            {t('editForm.valueLabel')}
          </label>
          <input
            autoCapitalize="off"
            autoFocus
            className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950/45 px-3 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-brand/15"
            id={inputId}
            onChange={(e) => setEditValue(e.target.value)}
            required
            type="text"
            value={editValue}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">{t('editForm.levelLabel')}</label>
          <div className="flex gap-2">
            {CENSORSHIP_LEVELS.map(({ level: levelNum, messagePath }) => {
              return (
                <button
                  aria-pressed={editLevel === levelNum}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm transition hover:bg-zinc-800 aria-pressed:border-brand/70 aria-pressed:bg-brand/10"
                  key={levelNum}
                  onClick={() => setEditLevel(levelNum)}
                  type="button"
                >
                  {t(messagePath)}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium transition hover:bg-zinc-800"
            disabled={updateMutation.isPending}
            onClick={handleCancelEdit}
            type="button"
          >
            {t('editForm.cancel')}
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand/85 px-3 py-2 text-sm font-semibold text-background transition hover:bg-brand disabled:opacity-50"
            disabled={updateMutation.isPending || !editValue.trim() || (editValue === value && editLevel === level)}
            type="submit"
          >
            {updateMutation.isPending ? (
              <span>{t('editForm.saving')}</span>
            ) : (
              <>
                <Check className="size-4" />
                <span>{t('editForm.save')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
