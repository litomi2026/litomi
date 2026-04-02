'use client'

import { SubmitEvent, useRef } from 'react'
import { toast } from 'sonner'

import usePatchMySettingsMutation from '@/query/usePatchMySettingsMutation'

type Props = {
  autoDeletionDay: number
}

const dayOptions = [
  { value: 0, label: '사용 안 함' },
  { value: 30, label: '1개월' },
  { value: 90, label: '3개월' },
  { value: 180, label: '6개월' },
  { value: 365, label: '1년' },
  { value: 1095, label: '3년' },
]

export default function AutoDeletionForm({ autoDeletionDay }: Props) {
  const savedAutoDeletionDayRef = useRef(autoDeletionDay)
  const patchMySettingsMutation = usePatchMySettingsMutation()

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const selectedDay = Number(formData.get('autoDeletionDay'))

    if (selectedDay === savedAutoDeletionDayRef.current) {
      toast.warning('변경할 설정이 없어요')
      return
    }

    await patchMySettingsMutation.mutateAsync({ autoDeletionDay: selectedDay })

    savedAutoDeletionDayRef.current = selectedDay
    toast.success('자동 삭제 설정이 반영됐어요')
  }

  return (
    <form className="group/auto-deletion grid gap-4" onSubmit={handleSubmit}>
      <p className="text-sm text-zinc-400">
        설정한 기간 동안 로그인하지 않으면 개인정보 보호를 위해 계정이 자동으로 삭제돼요
      </p>
      <div className="grid gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {dayOptions.map((option) => (
            <label className="cursor-pointer" key={option.value}>
              <input
                className="peer sr-only"
                defaultChecked={autoDeletionDay === option.value}
                disabled={patchMySettingsMutation.isPending}
                name="autoDeletionDay"
                type="radio"
                value={option.value}
              />
              <div
                className="relative flex items-center gap-3 rounded-lg border border-zinc-800 px-4 py-3 text-zinc-300 transition
                hover:border-zinc-700 peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:text-zinc-100
                peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{option.label}</div>
                  {option.value > 0 && (
                    <div className="mt-0.5 text-xs text-zinc-500">{option.value}일 후 자동 삭제</div>
                  )}
                </div>
                <div className="h-2 w-2 rounded-full bg-brand opacity-0 transition peer-checked:opacity-100" />
              </div>
            </label>
          ))}
        </div>
        <div
          className="rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-400 space-y-1
          group-has-[input[name=autoDeletionDay][value=0]:checked]/auto-deletion:hidden"
        >
          <p>• 삭제 30일 전에 알림을 보내드려요</p>
          <p>• 로그인하면 자동 삭제가 취소돼요</p>
        </div>
      </div>
      <button
        className="p-2 relative bg-brand font-medium text-background rounded-lg transition text-sm w-full
          hover:bg-brand/90 disabled:opacity-50
          focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-zinc-900"
        disabled={patchMySettingsMutation.isPending}
        type="submit"
      >
        저장
      </button>
    </form>
  )
}
