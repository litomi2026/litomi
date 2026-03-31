'use client'

import { useMutation } from '@tanstack/react-query'
import { BellRing, Loader2 } from 'lucide-react'
import { ReadonlyURLSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import IconBell from '@/components/icons/IconBell'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import { MAX_NOTIFICATION_CRITERIA_CONDITIONS } from '@/constants/policy'
import useMeQuery from '@/query/useMeQuery'
import { ProblemDetailsError } from '@/utils/react-query-error'

import { createNotificationCriteria } from './api'
import { ParsedSearchQuery, parseSearchQuery } from './utils/queryParser'

export default function KeywordSubscriptionButton() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const router = useRouter()
  const { data: me } = useMeQuery()
  const [query, setQuery] = useState<ParsedSearchQuery | null>(null)
  const buttonTitle = isSubscribed ? '키워드 알림 설정을 확인해요' : '키워드 알림을 설정해요'
  const buttonLabel = isSubscribed ? '설정 보기' : '키워드 알림'

  const createCriteriaMutation = useMutation({
    mutationFn: createNotificationCriteria,
    onError: (response) => {
      if (response instanceof ProblemDetailsError && response.status === 409) {
        setIsSubscribed(true)
      }
    },
    onSuccess: () => {
      toast.success(`키워드 알림이 설정됐어요: ${query?.suggestedName ?? ''}`)
      setIsSubscribed(true)
    },
  })

  const isPending = createCriteriaMutation.isPending

  function handleUpdateQuery(searchParams: ReadonlyURLSearchParams) {
    setQuery(parseSearchQuery(searchParams.get('query') ?? ''))
  }

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
      toast.warning('키워드 알림으로 등록할 수 있는 검색 조건이 없어요')
      return
    }

    if (query.conditions.length > MAX_NOTIFICATION_CRITERIA_CONDITIONS) {
      toast.warning(`최대 ${MAX_NOTIFICATION_CRITERIA_CONDITIONS}개 조건까지 설정할 수 있어요`)
      return
    }

    if (isSubscribed) {
      router.push(`/@${me.name}/settings/#keyword`)
      return
    }

    createCriteriaMutation.mutate({
      name: query.suggestedName,
      isActive: true,
      conditions: query.conditions.map((condition) => ({
        type: condition.type,
        value: condition.value,
        isExcluded: condition.isExcluded,
      })),
    })
  }

  // NOTE: 검색어가 변경되면 구독 상태를 초기화함
  useEffect(() => {
    setIsSubscribed(false)
  }, [query])

  return (
    <button
      aria-label={buttonTitle}
      aria-pressed={isSubscribed}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[1.1rem] transition border
        bg-zinc-950/78 border-white/10 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
        hover:border-white/16 hover:bg-zinc-900/82
        focus:outline-none focus:ring-2 focus:ring-white/15 focus:ring-offset-2 focus:ring-offset-zinc-950
        disabled:opacity-50 aria-pressed:bg-zinc-800 aria-pressed:border-brand/70 aria-pressed:text-zinc-100 aria-pressed:hover:border-brand"
      disabled={isPending}
      onClick={handleToggleSubscription}
      title={buttonTitle}
      type="button"
    >
      <SearchParamsSync onUpdate={handleUpdateQuery} />
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isSubscribed ? (
        <BellRing className="size-4 text-brand" />
      ) : (
        <IconBell className="size-4" />
      )}
      <span className="md:hidden lg:inline">{buttonLabel}</span>
    </button>
  )
}
