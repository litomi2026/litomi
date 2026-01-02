'use client'

import dayjs from 'dayjs'
import { BellOff, Edit3, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import IconBell from '@/components/icons/IconBell'
import Toggle from '@/components/ui/Toggle'
import { NotificationConditionType } from '@/database/enum'
import useServerAction from '@/hook/useServerAction'

import type { NotificationCriteria } from './types'

import { deleteNotificationCriteria, toggleNotificationCriteria } from './actions'

interface NotificationCriteriaCardProps {
  criterion: NotificationCriteria
  onEdit: (criterion: NotificationCriteria) => void
}

const CONDITION_TYPE_LABELS: Record<number, string> = {
  [NotificationConditionType.SERIES]: '시리즈',
  [NotificationConditionType.CHARACTER]: '캐릭터',
  [NotificationConditionType.TAG]: '태그',
  [NotificationConditionType.ARTIST]: '작가',
  [NotificationConditionType.GROUP]: '그룹',
  [NotificationConditionType.LANGUAGE]: '언어',
  [NotificationConditionType.UPLOADER]: '업로더',
}

export default function NotificationCriteriaCard({ criterion, onEdit }: NotificationCriteriaCardProps) {
  const [, dispatchToggle, isToggling] = useServerAction({
    action: toggleNotificationCriteria,
    onSuccess: (data) => {
      toast.success(data.isActive ? '알림을 활성화했어요' : '알림을 비활성화했어요')
    },
    shouldSetResponse: false,
  })

  const [, dispatchDelete, isDeleting] = useServerAction({
    action: deleteNotificationCriteria,
    onSuccess: () => {
      toast.success('알림 기준을 삭제했어요')
    },
    shouldSetResponse: false,
  })

  const handleToggle = (_newState: boolean) => {
    const formData = new FormData()
    formData.append('id', criterion.id.toString())
    formData.append('isActive', criterion.isActive.toString())

    dispatchToggle(formData)
  }

  const handleDelete = () => {
    if (!confirm('이 알림 기준을 삭제할까요?')) {
      return
    }

    const formData = new FormData()
    formData.append('id', criterion.id.toString())

    dispatchDelete(formData)
  }

  const getRelativeTime = (date: Date | null) => {
    if (!date) return null
    const now = dayjs()
    const target = dayjs(date)
    const diffDays = now.diff(target, 'day')

    if (diffDays === 0) {
      const diffHours = now.diff(target, 'hour')
      if (diffHours === 0) {
        const diffMinutes = now.diff(target, 'minute')
        return `${diffMinutes}분 전`
      }
      return `${diffHours}시간 전`
    } else if (diffDays === 1) {
      return '어제'
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}주 전`
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)}달 전`
    }
    return target.format('YYYY년 M월 D일')
  }

  return (
    <div
      aria-busy={isToggling || isDeleting}
      className="group/card relative bg-zinc-900 border-2 rounded-xl p-4 sm:p-5 data-[active=true]:border-brand/70 transition-all hover:border-zinc-700 aria-busy:opacity-60 aria-busy:pointer-events-none"
      data-active={criterion.isActive}
    >
      <div className="flex items-start gap-4">
        <div
          aria-selected={criterion.isActive}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl aria-selected:bg-brand/10 bg-zinc-800/50 flex items-center justify-center transition"
        >
          {criterion.isActive ? (
            <IconBell className="h-5 w-5 text-brand" />
          ) : (
            <BellOff className="h-5 w-5 text-zinc-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-sm sm:text-base text-zinc-100 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="break-all line-clamp-1">{criterion.name}</span>
              {criterion.isActive && (
                <span className="whitespace-nowrap hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                  <span className="text-brand font-medium">활성</span>
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              <Toggle
                checked={criterion.isActive}
                className="w-10 sm:w-11 sm:h-6 peer-checked:bg-brand/80"
                disabled={isToggling || isDeleting}
                onToggle={handleToggle}
              />
              <button
                className="p-2 text-zinc-600 hover:text-zinc-400 rounded-xl hover:bg-zinc-800/50 transition disabled:opacity-50"
                disabled={isToggling || isDeleting}
                onClick={() => onEdit(criterion)}
                title="수정"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                className="p-2 text-zinc-600 hover:text-red-400 rounded-xl hover:bg-red-900/10 transition disabled:opacity-50"
                disabled={isToggling || isDeleting}
                onClick={handleDelete}
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {criterion.matchCount > 0 && (
              <p className="text-xs sm:text-sm text-zinc-400">{criterion.matchCount}회 알림</p>
            )}
            {criterion.matchCount > 0 && criterion.lastMatchedAt && <span className="text-zinc-600">·</span>}
            {criterion.lastMatchedAt && (
              <p className="text-xs sm:text-sm text-zinc-500">마지막 {getRelativeTime(criterion.lastMatchedAt)}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {criterion.conditions.map((condition, index) => (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                  condition.isExcluded ? 'bg-zinc-900 border border-zinc-700 opacity-60' : 'bg-zinc-800'
                }`}
                key={index}
                title={`${condition.isExcluded ? '제외' : '포함'}: ${CONDITION_TYPE_LABELS[condition.type]} - ${condition.value}`}
              >
                {condition.isExcluded && (
                  <svg aria-hidden="true" className="w-2.5 h-2.5 text-zinc-400" fill="none" viewBox="0 0 8 8">
                    <path d="M1 4h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                  </svg>
                )}
                <span className="font-medium text-zinc-300">{CONDITION_TYPE_LABELS[condition.type]}</span>
                <span className="text-zinc-400 max-w-[120px] truncate">{condition.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      {criterion.isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-brand/80 to-transparent opacity-0 group-hover/card:opacity-100 transition" />
      )}
    </div>
  )
}
