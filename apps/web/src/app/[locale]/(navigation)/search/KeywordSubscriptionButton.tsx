'use client'

import { MAX_NOTIFICATION_CRITERIA_CONDITIONS } from '@litomi/domain/notification/policy'
import { useMutation } from '@tanstack/react-query'
import { BellRing, Loader2 } from 'lucide-react'
import type { ReadonlyURLSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import IconBell from '@/components/icons/IconBell'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import { useRouter } from '@/i18n/navigation'
import { ProblemDetailsError } from '@/utils/fetch-response'

import { createNotificationCriteria } from './api'
import { SearchParam } from './constants'
import { type ParsedSearchQuery, parseSearchQuery } from './utils/queryParser'

export default function KeywordSubscriptionButton() {
  const [query, setQuery] = useState<ParsedSearchQuery>(() => parseSearchQuery(''))
  const [isSubscribed, setIsSubscribed] = useState(false)
  const { guardAdultAccess, me } = useAdultAccessGuard()
  const t = useTranslations('Search.subscription')
  const router = useRouter()

  const buttonTitle = isSubscribed ? t('subscribedTitle') : t('subscribeTitle')
  const buttonLabel = isSubscribed ? t('subscribedLabel') : t('subscribeLabel')

  const createCriteriaMutation = useMutation({
    mutationFn: createNotificationCriteria,
    onError: (response) => {
      if (response instanceof ProblemDetailsError && response.status === 409) {
        setIsSubscribed(true)
      }
    },
    onSuccess: () => {
      toast.success(t('success', { name: query?.suggestedName ?? '' }))
      setIsSubscribed(true)
    },
  })

  const isPending = createCriteriaMutation.isPending

  function handleUpdateQuery(searchParams: ReadonlyURLSearchParams) {
    setQuery(parseSearchQuery(searchParams.get(SearchParam.QUERY) ?? ''))
  }

  function handleToggleSubscription() {
    if (!guardAdultAccess()) {
      return
    }

    if (!query.suggestedName) {
      toast.warning(t('missingQuery'))
      return
    }

    if (query.conditions.length === 0) {
      toast.warning(t('emptyConditions'))
      return
    }

    if (query.conditions.length > MAX_NOTIFICATION_CRITERIA_CONDITIONS) {
      toast.warning(t('tooManyConditions', { count: MAX_NOTIFICATION_CRITERIA_CONDITIONS }))
      return
    }

    if (isSubscribed) {
      router.push('/settings#keyword')
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
      className={twMerge(
        'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[1.1rem] transition border',
        'bg-zinc-900/92 border-zinc-700 text-zinc-200 shadow-sm',
        'hover:border-zinc-600 hover:bg-zinc-800/80',
        'focus:outline-none focus:ring-2 focus:ring-zinc-500/30 focus:ring-offset-2 focus:ring-offset-background',
        'disabled:opacity-50 aria-pressed:bg-zinc-800 aria-pressed:border-brand/70 aria-pressed:text-foreground aria-pressed:hover:border-brand',
      )}
      disabled={me === undefined || isPending}
      onClick={handleToggleSubscription}
      title={buttonTitle}
      type="button"
    >
      <SearchParamsSync onUpdate={handleUpdateQuery} />
      {isPending ? (
        <Loader2 className="size-4 sm:size-5 animate-spin" />
      ) : isSubscribed ? (
        <BellRing className="size-4 sm:size-5 text-brand" />
      ) : (
        <IconBell className="size-4 sm:size-5" />
      )}
      <span className="md:hidden lg:inline">{buttonLabel}</span>
    </button>
  )
}
