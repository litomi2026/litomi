'use client'

import { Info, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import usePatchMySettingsMutation from '@/query/usePatchMySettingsMutation'

import { DEFAULT_CENSORSHIP_VALUES } from './constants'

export default function DefaultCensorshipInfo() {
  const t = useTranslations('Censorship')
  const { guardLogin, me } = useAdultAccessGuard()
  const patchMySettingsMutation = usePatchMySettingsMutation()
  const defaultCensorshipEnabled = me?.settings.defaultCensorshipEnabled
  const defaultCensorshipValueGroups = groupDefaultCensorshipValues()

  async function handleToggleDefaultCensorship() {
    if (!guardLogin()) {
      return
    }

    const nextValue = !defaultCensorshipEnabled
    await patchMySettingsMutation.mutateAsync({ defaultCensorshipEnabled: nextValue })
    toast.success(nextValue ? t('defaultInfo.enableSuccessToast') : t('defaultInfo.disableSuccessToast'))
  }

  return (
    <div className="mx-4 rounded-lg border-2 border-zinc-700 bg-zinc-800/50 overflow-hidden">
      <div className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          {defaultCensorshipEnabled ? (
            <Info className="size-4 text-yellow-500 mt-0.5 shrink-0" />
          ) : (
            <ShieldOff className="size-4 text-green-500 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="text-zinc-300">
              {defaultCensorshipEnabled ? t('defaultInfo.enabledStatus') : t('defaultInfo.disabledStatus')}
            </p>
            <p className="text-xs text-zinc-500 mt-1">{t('defaultInfo.description')}</p>
          </div>
        </div>
        <button
          className="px-3 py-2 min-w-36 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={me === undefined || patchMySettingsMutation.isPending}
          onClick={handleToggleDefaultCensorship}
          type="button"
        >
          {patchMySettingsMutation.isPending ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : defaultCensorshipEnabled ? (
            <ShieldOff className="size-4 shrink-0" />
          ) : (
            <ShieldCheck className="size-4 shrink-0" />
          )}
          <span>{defaultCensorshipEnabled ? t('defaultInfo.disableAction') : t('defaultInfo.enableAction')}</span>
        </button>
      </div>

      <details className="group border-t-2 border-zinc-700">
        <summary className="px-4 py-3 flex items-center gap-2 hover:bg-zinc-800/70 transition cursor-pointer list-none text-sm text-zinc-400">
          <Info className="size-4 text-zinc-500 shrink-0" />
          <span>{t('defaultInfo.tagSummary')}</span>
        </summary>
        <div className="px-4 pb-4 text-sm text-zinc-400">
          <ul className="space-y-1">
            {defaultCensorshipValueGroups.map(({ messagePath, values }) => (
              <li className="flex items-center gap-2" key={messagePath}>
                <span className="text-zinc-500">•</span>
                <span>
                  {t(messagePath)} ({values.join(', ')})
                </span>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  )
}

function groupDefaultCensorshipValues() {
  return DEFAULT_CENSORSHIP_VALUES.reduce<{ messagePath: string; values: string[] }[]>((groups, item) => {
    const group = groups.find(({ messagePath }) => messagePath === item.messagePath)
    if (group) {
      group.values.push(item.value)
    } else {
      groups.push({ messagePath: item.messagePath, values: [item.value] })
    }
    return groups
  }, [])
}
