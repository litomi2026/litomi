'use client'

import type { PATCHV1MePushSettingsBody, PATCHV1MePushSettingsResponse } from '@litomi/contracts'
import { getTimezoneOffsetHours, localToUtcHour, utcToLocalHour } from '@litomi/std'
import { Toggle } from '@litomi/ui'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Moon } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import CustomSelect from '@/components/ui/CustomSelect'
import { useRouter } from '@/i18n/navigation'
import type { ProblemDetailsError } from '@/utils/fetch-response'

import { updatePushSettings } from './api'

type Props = {
  initialSettings: {
    quietEnabled: boolean
    quietStart: number
    quietEnd: number
    batchEnabled: boolean
    maxDaily: number
  }
}

export default function PushSettingsForm({ initialSettings }: Props) {
  const router = useRouter()
  const localQuietStart = utcToLocalHour(initialSettings.quietStart)

  const updateMutation = useMutation<PATCHV1MePushSettingsResponse, ProblemDetailsError, PATCHV1MePushSettingsBody>({
    mutationFn: updatePushSettings,
    onSuccess: ({ message }) => {
      toast.success(message)
      router.refresh()
    },
  })

  const isPending = updateMutation.isPending
  const localQuietEnd = utcToLocalHour(initialSettings.quietEnd)
  const offset = getTimezoneOffsetHours()
  const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const timezoneInfo = `${timezone} UTC${offsetStr}`

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${String(i).padStart(2, '0')}:00`,
  }))

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    updateMutation.mutate({
      quietEnabled: formData.has('quietEnabled'),
      quietStart: localToUtcHour(Number(formData.get('quietStart'))),
      quietEnd: localToUtcHour(Number(formData.get('quietEnd'))),
      batchEnabled: formData.has('batchEnabled'),
      maxDaily: Number(formData.get('maxDaily')),
    })
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <ToggleSection
        description={<span suppressHydrationWarning>{`설정한 시간에는 알림을 보내지 않아요 (${timezoneInfo})`}</span>}
        icon={<Moon className="size-4 shrink-0 text-zinc-400" />}
        title="방해 금지 시간"
      >
        <Toggle
          aria-label="방해 금지 시간 활성화"
          className="w-12 sm:w-14 peer-checked:bg-brand/80"
          defaultChecked={initialSettings.quietEnabled}
          name="quietEnabled"
        />
        <div className="grid grid-cols-2 gap-2 whitespace-nowrap sm:flex sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <CustomSelect
              className="w-full sm:w-24"
              defaultValue={localQuietStart.toString()}
              key={localQuietStart}
              name="quietStart"
              options={hourOptions.map((option) => ({
                value: option.value.toString(),
                label: option.label,
              }))}
            />
            <span className="text-xs sm:text-sm text-zinc-400">부터</span>
          </div>
          <div className="flex items-center gap-2">
            <CustomSelect
              className="w-full sm:w-24"
              defaultValue={localQuietEnd.toString()}
              key={localQuietEnd}
              name="quietEnd"
              options={hourOptions.map((option) => ({
                value: option.value.toString(),
                label: option.label,
              }))}
            />
            <span className="text-xs sm:text-sm text-zinc-400">까지</span>
          </div>
        </div>
      </ToggleSection>
      <ToggleSection description="여러 업데이트를 모아서 알림" title="스마트 알림">
        <Toggle
          aria-label="스마트 알림 활성화"
          className="w-12 sm:w-14 peer-checked:bg-brand/80"
          defaultChecked={initialSettings.batchEnabled}
          name="batchEnabled"
        />
      </ToggleSection>
      <ToggleSection description="하루 최대 알림 개수" title="일일 제한">
        <CustomSelect
          className="min-w-[80px]"
          defaultValue={initialSettings.maxDaily.toString()}
          key={initialSettings.maxDaily}
          name="maxDaily"
          options={[
            { value: '5', label: '5개' },
            { value: '10', label: '10개' },
            { value: '20', label: '20개' },
            { value: '50', label: '50개' },
            { value: '999', label: '무제한' },
          ]}
        />
      </ToggleSection>
      <button
        className={twMerge(
          'px-4 py-2.5 mt-2 relative bg-brand font-medium text-background rounded-lg transition text-sm',
          'hover:bg-brand/90 disabled:opacity-50',
          'focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-zinc-900',
          'w-full sm:w-auto sm:px-6',
        )}
        disabled={isPending}
        type="submit"
      >
        {isPending && (
          <Loader2 className="size-4 shrink-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        )}
        설정 저장
      </button>
    </form>
  )
}

function ToggleSection({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string | ReactNode
  icon?: ReactNode
  children: ReactNode | ReactNode[]
}) {
  return (
    <label className="grid gap-3 rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0 grid gap-1">
          <div className="flex items-center gap-2">
            {icon}
            <h4 className="font-medium text-sm">{title}</h4>
          </div>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        <div className="shrink-0">{Array.isArray(children) ? children[0] : children}</div>
      </div>
      {Array.isArray(children) ? children[1] : null}
    </label>
  )
}
