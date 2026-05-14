'use client'

import { Eye, History, Loader2 } from 'lucide-react'
import { type ReactNode, SubmitEvent, useRef } from 'react'
import { toast } from 'sonner'

import type { UserSettings } from '@/utils/user-settings'

import Toggle from '@/components/ui/Toggle'
import usePatchMySettingsMutation from '@/query/usePatchMySettingsMutation'

type Props = {
  initialSettings: UserSettings
}

export default function ContentSettingsForm({ initialSettings }: Props) {
  const savedSettingsRef = useRef({
    historySyncEnabled: initialSettings.historySyncEnabled,
    adultVerifiedAdVisible: initialSettings.adultVerifiedAdVisible,
  })

  const patchMySettingsMutation = usePatchMySettingsMutation()

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    const nextSettings = {
      historySyncEnabled: formData.has('historySyncEnabled'),
      adultVerifiedAdVisible: formData.has('adultVerifiedAdVisible'),
    }

    if (
      nextSettings.historySyncEnabled === savedSettingsRef.current.historySyncEnabled &&
      nextSettings.adultVerifiedAdVisible === savedSettingsRef.current.adultVerifiedAdVisible
    ) {
      toast.warning('변경할 설정이 없어요')
      return
    }

    await patchMySettingsMutation.mutateAsync(nextSettings)

    savedSettingsRef.current = nextSettings
    toast.success('감상 및 광고 설정이 반영됐어요')
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <SettingField
        description="감상 기록을 자동으로 서버에 저장하여 기기간 공유해요"
        icon={<History className="size-4 shrink-0 text-zinc-400" />}
        title="감상 기록 자동 저장"
      >
        <Toggle
          aria-label="감상 기록 자동 저장"
          className="w-12 sm:w-14 peer-checked:bg-brand/80"
          defaultChecked={initialSettings.historySyncEnabled}
          disabled={patchMySettingsMutation.isPending}
          name="historySyncEnabled"
        />
      </SettingField>
      <SettingField
        description="성인인증 완료 후 자동으로 숨겨지는 광고를 다시 표시해요"
        icon={<Eye className="size-4 shrink-0 text-zinc-400" />}
        title="광고 보기"
      >
        <Toggle
          aria-label="광고 보기"
          className="w-12 sm:w-14 peer-checked:bg-brand/80"
          defaultChecked={initialSettings.adultVerifiedAdVisible}
          disabled={patchMySettingsMutation.isPending}
          name="adultVerifiedAdVisible"
        />
      </SettingField>
      <button
        className="px-4 py-2.5 mt-2 relative bg-brand font-medium text-background rounded-lg transition text-sm
        hover:bg-brand/90 disabled:opacity-50
        focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-zinc-900
        w-full sm:w-auto sm:px-6"
        disabled={patchMySettingsMutation.isPending}
        type="submit"
      >
        {patchMySettingsMutation.isPending && (
          <Loader2 className="size-4 shrink-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        )}
        저장
      </button>
    </form>
  )
}

function SettingField({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string
  children: ReactNode
  icon: ReactNode
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
        <div className="shrink-0">{children}</div>
      </div>
    </label>
  )
}
