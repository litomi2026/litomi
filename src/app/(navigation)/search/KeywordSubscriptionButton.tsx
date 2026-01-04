'use client'

import { BellRing, Loader2 } from 'lucide-react'
import { ReadonlyURLSearchParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import IconBell from '@/components/icons/IconBell'
import useServerAction from '@/hook/useServerAction'
import useMeQuery from '@/query/useMeQuery'

import { subscribeToKeyword } from './action-keyword'
import UpdateFromSearchParams from './UpdateFromSearchParams'
import { ParsedSearchQuery, parseSearchQuery } from './utils/queryParser'

export default function KeywordSubscriptionButton() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const router = useRouter()
  const { data: me } = useMeQuery()
  const [query, setQuery] = useState<ParsedSearchQuery | null>(null)

  const [_, dispatchAction, isPending] = useServerAction({
    action: subscribeToKeyword,
    onError: (response) => {
      if (response.status === 409) {
        setIsSubscribed(true)
      }
    },
    onSuccess: () => {
      toast.success(`키워드 알림이 설정됐어요: ${query?.suggestedName ?? ''}`)
      setIsSubscribed(true)
    },
    shouldSetResponse: false,
  })

  const updateQuery = useCallback((searchParams: ReadonlyURLSearchParams) => {
    setQuery(parseSearchQuery(searchParams.get('query') ?? ''))
  }, [])

  function handleToggleSubscription() {
    if (isPending || !query) {
      return
    }

    if (!me) {
      toast.warning('로그인 후 이용해 주세요')
      return
    }

    if (!query.suggestedName) {
      toast.warning('검색어를 입력해 주세요')
      return
    }

    if (query.conditions.length === 0) {
      toast.warning('제외 키워드 알림은 아직 지원하지 않아요')
      return
    }

    if (query.plainKeywords.length > 20) {
      toast.warning('최대 20개 키워드까지 설정할 수 있어요')
      return
    }

    if (isSubscribed) {
      router.push(`/@${me.name}/settings/#keyword`)
      return
    }

    dispatchAction(query.conditions, query.suggestedName)
  }

  // NOTE: 검색어가 변경되면 구독 상태를 초기화함
  useEffect(() => {
    setIsSubscribed(false)
  }, [query])

  return (
    <button
      aria-pressed={isSubscribed}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl transition border-2 bg-zinc-900 border-zinc-700 hover:border-zinc-500 
      disabled:opacity-50 aria-pressed:bg-zinc-800 aria-pressed:border-brand/70 aria-pressed:text-zinc-100 aria-pressed:hover:border-brand"
      disabled={isPending}
      onClick={handleToggleSubscription}
      title={isSubscribed ? '키워드 알림 설정 보기' : '이 검색 조건으로 알림 받기'}
    >
      <UpdateFromSearchParams onUpdate={updateQuery} />
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isSubscribed ? (
        <BellRing className="size-4 text-brand" />
      ) : (
        <IconBell className="size-4" />
      )}
      <span>{isSubscribed ? '설정 보기' : '키워드 알림'}</span>
    </button>
  )
}
