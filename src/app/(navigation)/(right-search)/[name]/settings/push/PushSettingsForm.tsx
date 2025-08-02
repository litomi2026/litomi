'use client'

import { useParams } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'

import IconSpinner from '@/components/icons/IconSpinner'
import Toggle from '@/components/ui/Toggle'
import useActionResponse, { getFormField } from '@/hook/useActionResponse'
import { getUsernameFromParam } from '@/utils/param'

import { updatePushSettings } from './action'
import PushSubscriptionToggle from './PushSubscriptionToggle'
import PushTestButton from './PushTestButton'

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`,
}))

type Params = {
  name: string
}

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
  const [isEnabled, setIsEnabled] = useState(false)
  const { name } = useParams<Params>()

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

  // NOTE: 푸시 알림 권한 확인
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsEnabled(Notification.permission === 'granted')
    }
  }, [])

  return (
    <form action={dispatchAction} className="grid gap-6 mt-4">
      <input name="username" type="hidden" value={getUsernameFromParam(name)} />
      <p className="text-sm text-zinc-500">
        브라우저 Push API 기능으로 푸시 알림을 받을 수 있어요{' '}
        <a className="text-xs font-bold hover:underline" href="https://caniuse.com/push-api" target="_blank">
          (지원 브라우저)
        </a>
      </p>
      <ToggleSection description="새로운 만화가 업데이트되면 실시간으로 알려드려요" title="푸시 알림">
        <PushSubscriptionToggle isEnabled={isEnabled} onToggle={setIsEnabled} />
      </ToggleSection>
      <div
        aria-hidden={!isEnabled}
        className="space-y-4 transition duration-500 ease-in-out 
        aria-hidden:pointer-events-none aria-hidden:opacity-0 aria-hidden:translate-y-2"
      >
        <ToggleSection description="설정한 시간에는 알림을 보내지 않아요" title="방해 금지 시간">
          <Toggle
            className="w-14 peer-checked:bg-brand-end/80"
            defaultChecked={defaultQuietEnabled}
            name="quietEnabled"
          />
          <div className="flex items-center gap-3">
            <select
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm transition
              focus:outline-none focus:border-brand-end/50 focus:ring-1 focus:ring-brand-end/20
              hover:border-zinc-700 cursor-pointer"
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
            <span className="text-sm text-zinc-400">부터</span>
            <select
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm
                  transition
                  focus:outline-none focus:border-brand-end/50 focus:ring-1 focus:ring-brand-end/20
                  hover:border-zinc-700 cursor-pointer"
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
            <span className="text-sm text-zinc-400">까지</span>
          </div>
        </ToggleSection>
        <ToggleSection description="여러 업데이트를 하나로 모아서 알려드려요" title="스마트 알림">
          <Toggle
            className="w-14 peer-checked:bg-brand-end/80"
            defaultChecked={defaultBatchEnabled}
            name="batchEnabled"
          />
        </ToggleSection>
        <ToggleSection description="하루 최대 알림 개수를 설정합니다" title="일일 알림 제한">
          <select
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm
                transition
                focus:outline-none focus:border-brand-end/50 focus:ring-1 focus:ring-brand-end/20
                hover:border-zinc-700 cursor-pointer"
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
        <div className="flex justify-end gap-3 pt-4">
          <button
            className="px-4 py-2 relative bg-brand-end font-bold text-background rounded-lg transition text-sm
            disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending}
            type="submit"
          >
            {isPending && <IconSpinner className="w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
            저장하기
          </button>
          <PushTestButton isEnabled={isEnabled} />
        </div>
      </div>
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
  children,
}: {
  title: string
  description: string
  children: ReactNode | ReactNode[]
}) {
  return (
    <label className="grid gap-4 bg-zinc-900/50 rounded-xl p-6 backdrop-blur-sm border cursor-pointer hover:border-zinc-700 transition">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-base mb-1">{title}</h4>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
        {Array.isArray(children) ? children[0] : children}
      </div>
      {Array.isArray(children) ? children[1] : null}
    </label>
  )
}
