'use client'

import { useQueryClient } from '@tanstack/react-query'
import { startTransition, useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CensorshipItem } from '@/app/api/censorships/route'
import IconCheck from '@/components/icons/IconCheck'
import IconEdit from '@/components/icons/IconEdit'
import { QueryKeys } from '@/constants/query'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import useActionErrorEffect from '@/hook/useActionErrorEffect'
import useActionSuccessEffect from '@/hook/useActionSuccessEffect'

import { updateCensorships } from './action'
import { CENSORSHIP_LEVEL_LABELS } from './constants'

const initialUpdateState = {} as Awaited<ReturnType<typeof updateCensorships>>

type Props = {
  censorship: CensorshipItem
  isSelected: boolean
  isEditing: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onCancelEdit: () => void
  keyLabels: Record<CensorshipKey, string>
}

export default function CensorshipCard({
  censorship,
  isSelected,
  isEditing,
  onToggleSelect,
  onEdit,
  onCancelEdit,
  keyLabels,
}: Readonly<Props>) {
  const queryClient = useQueryClient()
  const [updateState, updateAction, isUpdatePending] = useActionState(updateCensorships, initialUpdateState)
  const [editValue, setEditValue] = useState(censorship.value)
  const [editLevel, setEditLevel] = useState(censorship.level)

  // Reset edit values when censorship prop changes or when editing state changes
  useEffect(() => {
    setEditValue(censorship.value)
    setEditLevel(censorship.level)
  }, [censorship.value, censorship.level, isEditing])

  const handleUpdateSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.censorships })
    toast.success('검열 규칙이 수정되었어요')
    onCancelEdit()
  }, [queryClient, onCancelEdit])

  useActionErrorEffect({
    status: updateState.status,
    error: updateState.message,
    onError: (message) => toast.error(message),
  })

  useActionSuccessEffect({
    status: updateState.status,
    data: updateState.data,
    onSuccess: handleUpdateSuccess,
  })

  const handleSaveEdit = () => {
    if (!editValue.trim() || (editValue === censorship.value && editLevel === censorship.level)) {
      onCancelEdit()
      return
    }

    // Prevent double submission
    if (isUpdatePending) {
      return
    }

    const formData = new FormData()
    formData.append('id', censorship.id.toString())
    formData.append('key', String(censorship.key))
    formData.append('value', editValue.trim())
    formData.append('level', String(editLevel))

    startTransition(() => {
      updateAction(formData)
    })
  }

  const handleCancelEdit = () => {
    setEditValue(censorship.value)
    setEditLevel(censorship.level)
    onCancelEdit()
  }

  const createdDate = new Date(censorship.createdAt)
  const dateString = createdDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (isEditing) {
    return (
      <div className="p-4 bg-zinc-800 rounded-lg border-2 border-brand-end">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">값</label>
            <input
              autoFocus
              className="w-full px-3 py-2 bg-zinc-700 rounded border-2 focus:border-zinc-500 outline-none transition"
              onChange={(e) => setEditValue(e.target.value)}
              type="text"
              value={editValue}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">수준</label>
            <div className="flex gap-2">
              {Object.entries(CENSORSHIP_LEVEL_LABELS).map(([level, { label }]) => (
                <button
                  aria-pressed={editLevel === Number(level)}
                  className="flex-1 px-3 py-2 rounded border-2 transition bg-zinc-700 hover:bg-zinc-600 aria-pressed:bg-zinc-600 aria-pressed:border-brand-end"
                  key={level}
                  onClick={() => setEditLevel(Number(level) as CensorshipLevel)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
              disabled={isUpdatePending}
              onClick={handleCancelEdit}
            >
              취소
            </button>
            <button
              className="flex-1 px-3 py-2 font-semibold bg-brand-end/80 text-background hover:bg-brand-end/90 rounded transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUpdatePending}
              onClick={handleSaveEdit}
            >
              {isUpdatePending ? (
                <span>저장 중...</span>
              ) : (
                <>
                  <IconCheck className="w-4" />
                  <span>저장</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      aria-selected={isSelected}
      className="p-4 bg-zinc-800 rounded-lg border-2 transition cursor-pointer hover:bg-zinc-700 aria-selected:border-brand-end aria-selected:bg-zinc-700"
      onClick={onToggleSelect}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          aria-checked={isSelected}
          className="w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition border-zinc-600 aria-checked:bg-brand-end aria-checked:border-brand-end"
          role="checkbox"
        >
          {isSelected && <IconCheck className="w-3 text-background" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{censorship.value}</span>
                <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded">{keyLabels[censorship.key]}</span>
                <span className={`text-xs font-medium ${CENSORSHIP_LEVEL_LABELS[censorship.level].color}`}>
                  {CENSORSHIP_LEVEL_LABELS[censorship.level].label}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">{dateString}에 추가됨</div>
            </div>

            {/* Edit Button */}
            <button
              className="p-1 hover:bg-zinc-600 rounded transition"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <IconEdit className="w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CensorshipCardSkeleton() {
  return (
    <div className="p-4 bg-zinc-800 rounded-lg border-2 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded border-2 mt-0.5 bg-zinc-700" />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-5 w-32 bg-zinc-700 rounded my-0.5" />
                <div className="h-4 w-16 bg-zinc-700 rounded" />
                <div className="h-4 w-12 bg-zinc-700 rounded" />
              </div>
              <div className="h-3 w-24 bg-zinc-700 rounded mt-2" />
            </div>
            <div className="w-6 h-6 bg-zinc-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
