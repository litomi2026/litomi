'use client'

import { Bookmark, Check, Clock, Download, Library, Loader2, ShieldCheck, Star } from 'lucide-react'
import { type ReactNode, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { downloadBlob } from '@/utils/download'

import { type DataCounts, exportUserData } from './actions'

type DataType = 'bookmarks' | 'censorships' | 'history' | 'libraries' | 'ratings'

type Props = {
  counts: DataCounts | null
}

const DATA_CONFIG: Record<DataType, { label: string; icon: ReactNode }> = {
  history: { label: '기록', icon: <Clock className="size-5" /> },
  bookmarks: { label: '북마크', icon: <Bookmark className="size-5" /> },
  ratings: { label: '별점', icon: <Star className="size-5" /> },
  libraries: { label: '서재', icon: <Library className="size-5" /> },
  censorships: { label: '검열 설정', icon: <ShieldCheck className="size-5" /> },
}

const ALL_TYPES = Object.keys(DATA_CONFIG) as DataType[]

export default function DataExportSectionClient({ counts }: Readonly<Props>) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<DataType>>(new Set(ALL_TYPES))

  function toggleType(type: DataType) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (selected.size === 0) {
      toast.warning('내보낼 데이터를 선택해 주세요')
      return
    }

    const formData = new FormData(e.currentTarget)
    const password = String(formData.get('password'))

    startTransition(async () => {
      const result = await exportUserData({
        password,
        includeHistory: selected.has('history'),
        includeBookmarks: selected.has('bookmarks'),
        includeRatings: selected.has('ratings'),
        includeLibraries: selected.has('libraries'),
        includeCensorships: selected.has('censorships'),
      })

      if (!result.ok) {
        const errorMessage =
          typeof result.error === 'string' ? result.error : Object.values(result.error as object).join(', ')

        if (result.status >= 500) {
          toast.error('요청을 처리할 수 없어요')
        } else {
          toast.warning(errorMessage || '요청을 처리할 수 없어요')
        }
        return
      }

      const blob = new Blob([result.data], { type: 'application/json' })
      downloadBlob(blob, `litomi-${new Date().toISOString().split('T')[0]}.json`)
      toast.success('데이터를 성공적으로 내보냈어요')
    })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">내보낼 데이터를 선택하세요</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {ALL_TYPES.map((type) => {
            const isChecked = selected.has(type)
            return (
              <button
                aria-pressed={isChecked}
                className="flex items-center gap-2 p-3 rounded-lg border-2 transition text-left
                  border-zinc-700 bg-zinc-800/30 hover:border-zinc-600
                  aria-pressed:border-brand aria-pressed:bg-brand/10"
                key={type}
                onClick={() => toggleType(type)}
                type="button"
              >
                <div
                  aria-hidden
                  className="size-4 shrink-0 rounded border-2 transition-all flex items-center justify-center
                    border-zinc-600 bg-zinc-800"
                  data-checked={isChecked || undefined}
                >
                  {isChecked && <Check className="size-3 text-brand" />}
                </div>
                <div className={`transition ${isChecked ? 'text-brand' : 'text-zinc-400'}`}>
                  {DATA_CONFIG[type].icon}
                </div>
                <span className="flex-1 min-w-0 text-sm font-medium truncate">{DATA_CONFIG[type].label}</span>
                {counts && <span className="text-xs text-zinc-500 shrink-0">{counts[type].toLocaleString()}</span>}
              </button>
            )
          })}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-zinc-400" htmlFor="export-password">
          비밀번호 확인
        </label>
        <input
          className="w-full p-3 py-2 bg-zinc-800 border-2 border-zinc-600 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent
            placeholder-zinc-500"
          disabled={isPending}
          id="export-password"
          name="password"
          placeholder="현재 비밀번호"
          required
          type="password"
        />
      </div>
      <button
        className="w-full px-4 py-2 bg-brand hover:bg-brand/90 disabled:bg-zinc-700 
          rounded-lg font-medium transition text-background
          flex items-center justify-center gap-2"
        disabled={isPending}
        type="submit"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        다운로드
      </button>
    </form>
  )
}
