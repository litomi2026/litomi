'use client'

import { Bell, BellOff } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import IconSpinner from '@/components/icons/IconSpinner'
import useActionResponse from '@/hook/useActionResponse'
import useDebouncedValue from '@/hook/useDebouncedValue'
import useMeQuery from '@/query/useMeQuery'

import { subscribeToKeyword } from './actions'
import { parseSearchQuery } from './utils/queryParser'

export default function KeywordSubscriptionButton() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: me } = useMeQuery()
  const query = searchParams.get('query') || ''
  const debouncedQuery = useDebouncedValue({ value: query, delay: 500 })
  const parsedQuery = useMemo(() => parseSearchQuery(debouncedQuery), [debouncedQuery])
  const hasValidConditions = parsedQuery.conditions.length > 0

  const [_, dispatchAction, isPending] = useActionResponse({
    action: subscribeToKeyword,
    onSuccess: () => {
      toast.success(`키워드 알림이 설정됐어요: ${parsedQuery.suggestedName}`)
      setIsSubscribed(true)
    },
    onError: (error, response) => {
      if (response.status === 409) {
        setIsSubscribed(true)
      }
      if (typeof error === 'string') {
        if (response.status >= 400 && response.status < 500) {
          toast.warning(error)
        } else {
          toast.error(error)
        }
      }
    },
    shouldSetResponse: false,
  })

  function handleToggleSubscription() {
    if (isPending) {
      return
    }

    if (!me) {
      toast.warning('로그인 후 이용해주세요')
      return
    }

    if (!query.trim() || !hasValidConditions) {
      toast.warning('검색어를 입력해주세요')
      return
    }

    if (!hasValidConditions) {
      toast.warning('제외 키워드 알림은 아직 지원하지 않아요')
      return
    }

    if (parsedQuery.plainKeywords.length > 20) {
      toast.warning('최대 20개 키워드까지 설정할 수 있어요')
      return
    }

    if (isSubscribed) {
      router.push(`/@${me.name}/settings/#keyword`)
      return
    }

    dispatchAction(parsedQuery.conditions, parsedQuery.suggestedName)
  }

  // NOTE: 검색어가 변경되면 구독 상태를 초기화함
  useEffect(() => {
    setIsSubscribed(false)
  }, [debouncedQuery.length])

  return (
    <button
      aria-pressed={isSubscribed}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl transition border-2 bg-zinc-900 border-zinc-700 hover:border-zinc-500 
      disabled:opacity-50 disabled:cursor-not-allowed aria-pressed:bg-zinc-800 aria-pressed:border-brand-end/70 aria-pressed:text-zinc-100 aria-pressed:hover:border-brand-end"
      disabled={isPending}
      onClick={handleToggleSubscription}
      title={isSubscribed ? '알림 해제' : '이 검색 조건으로 알림 받기'}
    >
      {isPending ? (
        <IconSpinner className="size-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="size-4 text-brand-end" />
      ) : (
        <BellOff className="size-4" />
      )}
      <span className="hidden sm:inline">{isSubscribed ? '키워드 보기' : '키워드 설정'}</span>
      <span className="sm:hidden">{isSubscribed ? '보기' : '설정'}</span>
    </button>
  )
}
