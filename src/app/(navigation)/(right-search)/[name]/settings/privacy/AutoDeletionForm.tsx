'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import useActionResponse from '@/hook/useActionResponse'

import { updateAutoDeletionSettings } from './action'

type Props = {
  autoDeletionDays: number
}

const dayOptions = [
  { value: 0, label: '사용 안 함' },
  { value: 30, label: '1개월' },
  { value: 90, label: '3개월' },
  { value: 180, label: '6개월' },
  { value: 365, label: '1년' },
  { value: 1095, label: '3년' },
]

export default function AutoDeletionForm({ autoDeletionDays }: Props) {
  const [selectedDays, setSelectedDays] = useState(autoDeletionDays)

  const [, dispatchAction, isPending] = useActionResponse({
    action: updateAutoDeletionSettings,
    onSuccess: () => {
      toast.success('자동 삭제 설정이 반영됐어요')
    },
    shouldSetResponse: false,
  })

  return (
    <form action={dispatchAction} className="grid gap-4">
      <p className="text-sm text-zinc-400">
        설정한 기간 동안 로그인하지 않으면 개인정보 보호를 위해 계정이 자동으로 삭제돼요
      </p>
      <div className="grid gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {dayOptions.map((option) => (
            <label
              aria-selected={selectedDays === option.value}
              className="relative flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition border-zinc-800 hover:border-zinc-700 text-zinc-300
                aria-selected:border-brand aria-selected:bg-brand/10 aria-selected:text-zinc-100"
              key={option.value}
            >
              <input
                className="sr-only"
                defaultChecked={selectedDays === option.value}
                name="autoDeletionDays"
                onChange={() => setSelectedDays(option.value)}
                type="radio"
                value={option.value}
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{option.label}</div>
                {option.value > 0 && <div className="text-xs text-zinc-500 mt-0.5">{option.value}일 후 자동 삭제</div>}
              </div>
              {selectedDays === option.value && <div className="w-2 h-2 rounded-full bg-brand" />}
            </label>
          ))}
        </div>
        {selectedDays > 0 && (
          <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400 space-y-1">
            <p>• 삭제 30일 전에 알림을 보내드려요</p>
            <p>• 로그인하면 자동 삭제가 취소돼요</p>
            <p>• 언제든지 설정을 변경할 수 있어요</p>
          </div>
        )}
      </div>
      <button
        className="p-2 relative bg-brand font-medium text-background rounded-lg transition text-sm w-full
          hover:bg-brand/90 disabled:opacity-50
          focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-zinc-900"
        disabled={isPending}
        type="submit"
      >
        저장
      </button>
    </form>
  )
}
