'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { addCensorships, deleteCensorships } from '@/app/(navigation)/(right-search)/[name]/censor/action'
import IconEyeOff from '@/components/icons/IconEyeOff'
import IconSearch from '@/components/icons/IconSearch'
import IconSpinner from '@/components/icons/IconSpinner'
import BottomSheet, { BottomSheetItem } from '@/components/ui/BottomSheet'
import { QueryKeys } from '@/constants/query'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import useClipboard from '@/hook/useClipboard'
import useCensorshipsMapQuery from '@/query/useCensorshipsMapQuery'
import useMeQuery from '@/query/useMeQuery'

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

export default function TagOptionsSheet({ isOpen, onClose, category, value, label }: Props) {
  const { copy } = useClipboard()
  const router = useRouter()
  const { data: me } = useMeQuery()
  const { data: censorshipsMap } = useCensorshipsMapQuery()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  const isLoggedIn = Boolean(me)
  const censorshipKey = TAG_CATEGORY_TO_CENSORSHIP_KEY[category] ?? CensorshipKey.TAG
  const censorshipLookupKey = `${censorshipKey}:${value.toLowerCase()}`
  const existingCensorship = censorshipsMap?.get(censorshipLookupKey)
  const isCensored = Boolean(existingCensorship)
  const fullTag = `${category}:${value}`

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
    startTransition(async () => {
      if (isCensored && existingCensorship) {
        const formData = new FormData()
        formData.append('id', String(existingCensorship.id))
        const result = await deleteCensorships(formData)

        if (!result.ok) {
          toast.error(typeof result.error === 'string' ? result.error : '검열 해제에 실패했어요')
          return
        }

        toast.success('검열을 해제했어요')
      } else {
        const formData = new FormData()
        formData.append('key', String(censorshipKey))
        formData.append('value', value)
        formData.append('level', String(CensorshipLevel.LIGHT))
        const result = await addCensorships(formData)

        if (!result.ok) {
          toast.error(typeof result.error === 'string' ? result.error : '검열 추가에 실패했어요')
          return
        }

        toast.success('검열을 추가했어요')
      }

      queryClient.invalidateQueries({ queryKey: QueryKeys.censorship })
      onClose()
    })
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={label}>
      <BottomSheetItem onClick={handleCopy}>
        <Copy className="size-5 text-zinc-400" />
        <span>태그 복사</span>
      </BottomSheetItem>

      <BottomSheetItem disabled={!isLoggedIn || isPending} onClick={handleToggleCensorship}>
        {isPending ? <IconSpinner className="size-5 text-zinc-400" /> : <IconEyeOff className="size-5 text-zinc-400" />}
        <span>{isCensored ? '검열 해제' : '검열하기'}</span>
        {!isLoggedIn && <span className="text-xs text-zinc-500 ml-auto">로그인 필요</span>}
      </BottomSheetItem>

      <BottomSheetItem onClick={handleExcludeSearch}>
        <IconSearch className="size-5 text-zinc-400" />
        <span>이 태그 제외하고 검색</span>
      </BottomSheetItem>
    </BottomSheet>
  )
}
