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
    <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/75">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3 text-sm">
          <div
            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
              defaultCensorshipEnabled ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'
            }`}
          >
            {defaultCensorshipEnabled ? <Info className="size-4" /> : <ShieldOff className="size-4" />}
          </div>
          <div>
            <p className="font-medium text-zinc-100">
              {defaultCensorshipEnabled ? t('defaultInfo.enabledStatus') : t('defaultInfo.disabledStatus')}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{t('defaultInfo.description')}</p>
          </div>
        </div>
        <button
          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-700 disabled:opacity-50 sm:min-w-40"
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

      <details className="group border-t border-zinc-800">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm text-zinc-400 transition hover:bg-zinc-800/35 sm:px-5">
          <Info className="size-4 text-zinc-500 shrink-0" />
          <span>{t('defaultInfo.tagSummary')}</span>
        </summary>
        <div className="px-4 pb-4 text-sm text-zinc-400 sm:px-5">
          <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {defaultCensorshipValueGroups.map(({ messagePath, values }) => (
              <li className="rounded-lg border border-zinc-800 bg-zinc-950/35 px-3 py-2" key={messagePath}>
                <span className="font-medium text-zinc-300">{t(messagePath)}</span>
                <span className="mt-0.5 block break-all text-xs leading-5 text-zinc-500">{values.join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </section>
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
