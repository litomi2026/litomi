'use client'

import type { POSTV1AuthSignupRequest, POSTV1AuthSignupResponse } from '@litomi/contracts'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import type { ProblemDetailsError } from '@/utils/fetch-response'

import { useRouter } from '@/i18n/navigation'
import { identify, track } from '@/lib/analytics/browser'
import { getAuthSuccessRedirect, getCurrentAuthRedirect } from '@/lib/auth-redirect'
import { resetAdultGatedQueries } from '@/lib/react-query/adult-gated-queries'
import { getMeQueryFetchOptions } from '@/query/useMeQuery'

import { signup } from './api'

export const SIGNUP_LOCAL_ERROR_STATUSES = [400, 409]

interface Params {
  onError?: (error: ProblemDetailsError) => void
}

export default function useSignupMutation({ onError }: Params = {}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('Auth.signup')

  return useMutation<POSTV1AuthSignupResponse, ProblemDetailsError, POSTV1AuthSignupRequest>({
    mutationFn: signup,
    onError,
    onSuccess: async ({ loginId, name, userId, nickname }) => {
      toast.success(t('success', { loginId }))

      if (userId) {
        identify(userId)
        track('signup', { loginId, nickname, name })
      }

      resetAdultGatedQueries(queryClient)

      await queryClient.fetchQuery({ ...getMeQueryFetchOptions(), staleTime: 0 }).catch(() => null)

      router.replace(getAuthSuccessRedirect(getCurrentAuthRedirect(), name))
    },
    meta: { suppressGlobalErrorToastForStatuses: SIGNUP_LOCAL_ERROR_STATUSES },
  })
}
