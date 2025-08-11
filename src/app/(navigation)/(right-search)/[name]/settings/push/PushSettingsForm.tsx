'use client'

import { Loader2, Moon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { ReactNode } from 'react'
import { toast } from 'sonner'

import Toggle from '@/components/ui/Toggle'
import useActionResponse, { getFormField } from '@/hook/useActionResponse'
import { getUsernameFromParam } from '@/utils/param'

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

  const [response, dispatchAction, isPending] = useActionResponse({
    action: updatePushSettings,
    onError: (error) => {
      if (typeof error === 'string') {
        toast.error(error)
      }
    },
    onSuccess: (data) => {
      toast.success(data)
    },
    shouldSetResponse: false,
  })

  const defaultQuietEnabled = getDefaultChecked(getFormField(response, 'quietEnabled')) ?? initialSettings.quietEnabled
  const defaultQuietStart = getFormField(response, 'quietStart') ?? initialSettings.quietStart
  const defaultQuietEnd = getFormField(response, 'quietEnd') ?? initialSettings.quietEnd
  const defaultBatchEnabled = getDefaultChecked(getFormField(response, 'batchEnabled')) ?? initialSettings.batchEnabled
  const defaultMaxDaily = getFormField(response, 'maxDaily') ?? initialSettings.maxDaily

  return (
    <form action={dispatchAction} className="grid gap-3">
      <input name="username" type="hidden" value={getUsernameFromParam(username)} />
      <ToggleSection
        description="설정한 시간에는 알림을 보내지 않아요"
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
            <select
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-sm transition
                focus:outline-none focus:border-brand-end/50 focus:ring-1 focus:ring-brand-end/20
                hover:border-zinc-700 cursor-pointer w-full sm:w-auto"
              defaultValue={defaultQuietStart}
              key={initialSettings.quietStart}
              name="quietStart"
            >
              {hourOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-xs sm:text-sm text-zinc-400">부터</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-sm
                transition
                focus:outline-none focus:border-brand-end/50 focus:ring-1 focus:ring-brand-end/20
                hover:border-zinc-700 cursor-pointer w-full sm:w-auto"
              defaultValue={defaultQuietEnd}
              key={initialSettings.quietEnd}
              name="quietEnd"
            >
              {hourOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
        <select
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-sm
            transition
            focus:outline-none focus:border-brand-end/50 focus:ring-1 focus:ring-brand-end/20
            hover:border-zinc-700 cursor-pointer min-w-[80px]"
          defaultValue={defaultMaxDaily}
          key={initialSettings.maxDaily}
          name="maxDaily"
        >
          <option value={5}>5개</option>
          <option value={10}>10개</option>
          <option value={20}>20개</option>
          <option value={50}>50개</option>
          <option value={999}>무제한</option>
        </select>
      </ToggleSection>
      <button
        className="px-4 py-2.5 mt-2 relative bg-brand-end font-medium text-background rounded-lg transition text-sm
        hover:bg-brand-end/90 disabled:opacity-50 disabled:cursor-not-allowed
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
  description: string
  icon?: ReactNode
  children: ReactNode | ReactNode[]
}) {
  return (
    <label className="grid gap-3 rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {icon}
            <h4 className="font-medium text-sm">{title}</h4>
          </div>
          <p className="text-xs text-zinc-500 pr-2">{description}</p>
        </div>
        <div className="flex-shrink-0">{Array.isArray(children) ? children[0] : children}</div>
      </div>
      {Array.isArray(children) ? children[1] : null}
    </label>
  )
}
