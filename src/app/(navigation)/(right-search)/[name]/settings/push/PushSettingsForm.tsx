'use client'

import { Loader2, Moon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { ReactNode } from 'react'
import { toast } from 'sonner'

import CustomSelect from '@/components/ui/CustomSelect'
import Toggle from '@/components/ui/Toggle'
import useActionResponse, { getFormField } from '@/hook/useActionResponse'
import { getUsernameFromParam } from '@/utils/param'
import { getTimezoneOffsetHours, localToUtcHour, utcToLocalHour } from '@/utils/timezone'

import { Params } from '../../common'
import { updatePushSettings } from './action'

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`,
}))

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
  const { name: username } = useParams<Params>()
  const localQuietStart = utcToLocalHour(initialSettings.quietStart)
  const localQuietEnd = utcToLocalHour(initialSettings.quietEnd)
  const offset = getTimezoneOffsetHours()
  const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const timezoneInfo = `${timezone} UTC${offsetStr}`

  function handleSubmit(formData: FormData) {
    const quietStart = formData.get('quietStart')
    const quietEnd = formData.get('quietEnd')

    if (quietStart !== null) {
      formData.set('quietStart', String(localToUtcHour(Number(quietStart))))
    }
    if (quietEnd !== null) {
      formData.set('quietEnd', String(localToUtcHour(Number(quietEnd))))
    }

    return updatePushSettings(formData)
  }

  const [response, dispatchAction, isPending] = useActionResponse({
    action: handleSubmit,
    onSuccess: (data) => {
      toast.success(data)
    },
  })

  const defaultQuietEnabled = getDefaultChecked(getFormField(response, 'quietEnabled')) ?? initialSettings.quietEnabled
  const defaultQuietStart = getFormField(response, 'quietStart') ?? localQuietStart
  const defaultQuietEnd = getFormField(response, 'quietEnd') ?? localQuietEnd
  const defaultBatchEnabled = getDefaultChecked(getFormField(response, 'batchEnabled')) ?? initialSettings.batchEnabled
  const defaultMaxDaily = getFormField(response, 'maxDaily') ?? initialSettings.maxDaily

  return (
    <form action={dispatchAction} className="grid gap-3">
      <input name="username" type="hidden" value={getUsernameFromParam(username)} />
      <ToggleSection
        description={<span suppressHydrationWarning>{`설정한 시간에는 알림을 보내지 않아요 (${timezoneInfo})`}</span>}
        icon={<Moon className="w-4 h-4 text-zinc-400" />}
        title="방해 금지 시간"
      >
        <Toggle
          aria-label="방해 금지 시간 활성화"
          className="w-12 sm:w-14 peer-checked:bg-brand-end/80"
          defaultChecked={defaultQuietEnabled}
          name="quietEnabled"
        />
        <div className="grid grid-cols-2 gap-2 whitespace-nowrap sm:flex sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <CustomSelect
              className="w-full sm:w-24"
              defaultValue={defaultQuietStart.toString()}
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
              defaultValue={defaultQuietEnd.toString()}
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
          className="w-12 sm:w-14 peer-checked:bg-brand-end/80"
          defaultChecked={defaultBatchEnabled}
          name="batchEnabled"
        />
      </ToggleSection>
      <ToggleSection description="하루 최대 알림 개수" title="일일 제한">
        <CustomSelect
          className="min-w-[80px]"
          defaultValue={defaultMaxDaily.toString()}
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
        className="px-4 py-2.5 mt-2 relative bg-brand-end font-medium text-background rounded-lg transition text-sm
        hover:bg-brand-end/90 disabled:opacity-50
        focus:outline-none focus:ring-2 focus:ring-brand-end/50 focus:ring-offset-2 focus:ring-offset-zinc-900
        w-full sm:w-auto sm:px-6"
        disabled={isPending}
        type="submit"
      >
        {isPending && (
          <Loader2 className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        )}
        설정 저장
      </button>
    </form>
  )
}

function getDefaultChecked(value?: string) {
  if (typeof value === 'string') {
    return value === 'on'
  }

  return value
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
