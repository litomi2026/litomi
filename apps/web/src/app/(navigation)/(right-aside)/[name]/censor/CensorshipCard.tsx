'use client'

import { Check, SquarePen } from 'lucide-react'
import { useCallback, useState } from 'react'

import { CensorshipKey, CensorshipLevel } from '@/database/enum'

import CensorshipEditForm from './CensorshipEditForm'
import { CENSORSHIP_KEY_LABELS, CENSORSHIP_LEVEL_LABELS } from './constants'

type Props = {
  censorship: {
    id: number
    key: CensorshipKey
    value: string
    level: CensorshipLevel
    createdAt: number
  }
  isSelected: boolean
  isDeleting?: boolean
  onToggleSelect: () => void
}

export default function CensorshipCard({
  censorship,
  isSelected,
  isDeleting = false,
  onToggleSelect,
}: Readonly<Props>) {
  const { key, value, level, createdAt } = censorship
  const [isEditing, setIsEditing] = useState(false)

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!isDeleting) {
        setIsEditing(true)
      }
    },
    [isDeleting],
  )

  const handleEditCompleted = useCallback(() => {
    setIsEditing(false)
  }, [])

  const dateString = new Date(createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (isEditing) {
    return <CensorshipEditForm censorship={censorship} onEditCompleted={handleEditCompleted} />
  }

  return (
    <div
      aria-selected={isSelected}
      className={`p-4 bg-zinc-800 rounded-lg border-2 transition relative ${
        isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-700'
      } aria-selected:border-brand aria-selected:bg-zinc-700`}
      onClick={isDeleting ? undefined : onToggleSelect}
    >
      {/* Deleting overlay with spinner */}
      {isDeleting && (
        <div className="absolute inset-0 bg-zinc-900/50 rounded-lg flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          aria-checked={isSelected}
          className="w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition border-zinc-600 aria-checked:bg-brand aria-checked:border-brand"
          role="checkbox"
        >
          {isSelected && <Check className="size-3 text-background" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{value}</span>
                <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded">{CENSORSHIP_KEY_LABELS[key]}</span>
                <span className={`text-xs font-medium ${CENSORSHIP_LEVEL_LABELS[level].color}`}>
                  {CENSORSHIP_LEVEL_LABELS[level].label}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">{dateString}에 추가됨</div>
            </div>
            <button
              aria-label="검열 규칙 수정"
              className={`p-1 rounded transition ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-600'}`}
              disabled={isDeleting}
              onClick={handleEdit}
              type="button"
            >
              <SquarePen className="size-4" />
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
