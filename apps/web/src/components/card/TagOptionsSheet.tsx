'use client'

import type { DELETEV1CensorshipDeleteResponse, POSTV1CensorshipCreateResponse } from '@litomi/contracts'

import { CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'
import { env } from '@litomi/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, EyeOff, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

import BottomSheet, { BottomSheetItem } from '@/components/ui/BottomSheet'
import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import useClipboard from '@/hook/useClipboard'
import { useRouter } from '@/i18n/navigation'
import { QueryKeys } from '@/lib/react-query/query-keys'
import useCensorshipsMapQuery from '@/query/useCensorshipsMapQuery'
import { fetchAPIData } from '@/utils/api-request'

type Props = {
  isOpen: boolean
  onClose: () => void
  category: string
  value: string
  label: string
}

const TAG_CATEGORY_TO_CENSORSHIP_KEY: Record<string, CensorshipKey> = {
  female: CensorshipKey.TAG_CATEGORY_FEMALE,
  male: CensorshipKey.TAG_CATEGORY_MALE,
  mixed: CensorshipKey.TAG_CATEGORY_MIXED,
  other: CensorshipKey.TAG_CATEGORY_OTHER,
}

const { NEXT_PUBLIC_API_ORIGIN } = env

export default function TagOptionsSheet({ isOpen, onClose, category, value, label }: Props) {
  const { copy } = useClipboard()
  const router = useRouter()
  const { canAccess, guardAdultAccess, me } = useAdultAccessGuard()
  const { data: censorshipsMap } = useCensorshipsMapQuery()
  const queryClient = useQueryClient()

  const isLoggedIn = Boolean(me)
  const censorshipKey = TAG_CATEGORY_TO_CENSORSHIP_KEY[category] ?? CensorshipKey.TAG
  const censorshipLookupKey = `${censorshipKey}:${value.toLowerCase()}`
  const existingCensorship = censorshipsMap?.get(censorshipLookupKey)
  const isCensored = Boolean(existingCensorship)
  const fullTag = `${category}:${value}`

  const toggleCensorshipMutation = useMutation({
    mutationFn: async () => {
      const url = new URL('/api/v1/censorship', NEXT_PUBLIC_API_ORIGIN)

      if (isCensored && existingCensorship) {
        await fetchAPIData<DELETEV1CensorshipDeleteResponse>(url, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ids: [existingCensorship.id] }),
        })
        return false
      }

      await fetchAPIData<POSTV1CensorshipCreateResponse>(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: [{ key: censorshipKey, value, level: CensorshipLevel.LIGHT }] }),
      })
      return true
    },
    onSuccess: (censored) => {
      toast.success(censored ? '검열을 추가했어요' : '검열을 해제했어요')
      queryClient.invalidateQueries({ queryKey: QueryKeys.censorship })
      onClose()
    },
  })

  function handleCopy() {
    copy(fullTag)
    onClose()
  }

  function handleExcludeSearch() {
    const searchParams = new URLSearchParams(window.location.search)
    const query = searchParams.get('query') ?? ''
    const excludeTag = `-${fullTag}`
    const newQuery = query ? `${query} ${excludeTag}` : excludeTag
    searchParams.set('query', newQuery)
    router.push(`/search?${searchParams}`)
    onClose()
  }

  function handleToggleCensorship() {
    if (!isLoggedIn || toggleCensorshipMutation.isPending) {
      return
    }

    if (!guardAdultAccess()) {
      return
    }

    toggleCensorshipMutation.mutate()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={label}>
      <BottomSheetItem onClick={handleCopy}>
        <Copy className="size-5 text-zinc-400" />
        <span>태그 복사</span>
      </BottomSheetItem>

      <BottomSheetItem disabled={!isLoggedIn || toggleCensorshipMutation.isPending} onClick={handleToggleCensorship}>
        {toggleCensorshipMutation.isPending ? (
          <Loader2 className="size-5 text-zinc-400 animate-spin" />
        ) : (
          <EyeOff className="size-5 text-zinc-400" />
        )}
        <span>{isCensored ? '검열 해제' : '검열하기'}</span>
        {!isLoggedIn && <span className="text-xs text-zinc-500 ml-auto">로그인 필요</span>}
        {isLoggedIn && !canAccess && <span className="text-xs text-zinc-500 ml-auto">성인인증 필요</span>}
      </BottomSheetItem>

      <BottomSheetItem onClick={handleExcludeSearch}>
        <Search className="size-5 text-zinc-400" />
        <span>이 태그 제외하고 검색</span>
      </BottomSheetItem>
    </BottomSheet>
  )
}
