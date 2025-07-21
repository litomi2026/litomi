'use client'

import { startTransition, useState } from 'react'

import { CensorshipItem } from '@/app/api/censorships/route'
import IconCheck from '@/components/icons/IconCheck'
import IconEdit from '@/components/icons/IconEdit'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'

import { CENSORSHIP_LEVEL_LABELS } from './constants'

type Props = {
  censorship: CensorshipItem
  isSelected: boolean
  isEditing: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (formData: FormData) => void
  keyLabels: Record<CensorshipKey, string>
}

export default function CensorshipCard({
  censorship,
  isSelected,
  isEditing,
  onToggleSelect,
  onEdit,
  onCancelEdit,
  onUpdate,
  keyLabels,
}: Readonly<Props>) {
  const [editValue, setEditValue] = useState(censorship.value)
  const [editLevel, setEditLevel] = useState(censorship.level)

  const handleSaveEdit = () => {
    if (!editValue.trim() || (editValue === censorship.value && editLevel === censorship.level)) {
      onCancelEdit()
      return
    }

    const formData = new FormData()
    formData.append('id', censorship.id.toString())
    formData.append('key', String(censorship.key))
    formData.append('value', editValue.trim())
    formData.append('level', String(editLevel))

    startTransition(() => {
      onUpdate(formData)
    })
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
              onClick={onCancelEdit}
            >
              취소
            </button>
            <button
              className="flex-1 px-3 py-2 font-semibold bg-brand-end/80 text-background hover:bg-brand-end/90 rounded transition flex items-center justify-center gap-1"
              onClick={handleSaveEdit}
            >
              <IconCheck className="w-4" />
              <span>저장</span>
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
