'use client'

import { Info, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'

import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import usePatchMySettingsMutation from '@/query/usePatchMySettingsMutation'

import { DEFAULT_CENSORED_TAGS } from './constants'

export default function DefaultCensorshipInfo() {
  const { guardLogin, me } = useAdultAccessGuard()
  const patchMySettingsMutation = usePatchMySettingsMutation()
  const defaultCensorshipEnabled = me?.settings.defaultCensorshipEnabled

  async function handleToggleDefaultCensorship() {
    if (!guardLogin()) {
      return
    }

    const nextValue = !defaultCensorshipEnabled

    await patchMySettingsMutation.mutateAsync({
      defaultCensorshipEnabled: nextValue,
    })

    toast.success(nextValue ? '기본 흐림 처리를 다시 켰어요' : '기본 흐림 처리를 껐어요')
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
            <p className="text-zinc-300">기본 흐림 처리가 {defaultCensorshipEnabled ? '켜져' : '꺼져'} 있어요</p>
            <p className="text-xs text-zinc-500 mt-1">직접 추가한 검열 규칙과 개별 태그 해제 설정은 그대로 유지돼요</p>
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
          <span>{defaultCensorshipEnabled ? '기본 흐림 처리 끄기' : '기본 흐림 처리 켜기'}</span>
        </button>
      </div>

      <details className="group border-t-2 border-zinc-700">
        <summary className="px-4 py-3 flex items-center gap-2 hover:bg-zinc-800/70 transition cursor-pointer list-none text-sm text-zinc-400">
          <Info className="size-4 text-zinc-500 shrink-0" />
          <span>기본 흐림 처리 태그 보기</span>
        </summary>
        <div className="px-4 pb-4 text-sm text-zinc-400">
          <ul className="space-y-1">
            {DEFAULT_CENSORED_TAGS.map((tag) => (
              <li className="flex items-center gap-2" key={tag}>
                <span className="text-zinc-500">•</span>
                <span>{tag}</span>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  )
}
