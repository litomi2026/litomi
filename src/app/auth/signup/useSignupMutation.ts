'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import type { POSTV1AuthSignupRequest, POSTV1AuthSignupResponse } from '@/backend/api/v1/auth/signup'
import type { ProblemDetailsError } from '@/utils/react-query-error'

import { QueryKeys } from '@/constants/query'
import { SearchParamKey } from '@/constants/storage'
import amplitude from '@/lib/amplitude/browser'
import { identify, track } from '@/lib/analytics/browser'
import { sanitizeRedirect } from '@/utils'

import { signup } from './api'
export const SIGNUP_LOCAL_ERROR_STATUSES = [400, 409]

interface Params {
  onError?: (error: ProblemDetailsError) => void
}

export default function useSignupMutation({ onError }: Params = {}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation<POSTV1AuthSignupResponse, ProblemDetailsError, POSTV1AuthSignupRequest>({
    mutationFn: signup,
    onError,
    onSuccess: async ({ loginId, name, userId, nickname }) => {
      toast.success(`${loginId} 계정으로 가입했어요`)

      if (userId) {
        amplitude.setUserId(userId)
        amplitude.track('signup', { loginId, nickname })
        identify(userId)
        track('signup')
      }

      await queryClient.invalidateQueries({ queryKey: QueryKeys.me, type: 'all' })

      const params = new URLSearchParams(window.location.search)
      const redirect = params.get(SearchParamKey.REDIRECT)
      const sanitizedURL = sanitizeRedirect(redirect) || '/'
      const redirectURL = sanitizedURL.replace(/^\/@(?=\/|$|\?)/, `/@${name}`)

      router.replace(redirectURL)
    },
    meta: { suppressGlobalErrorToastForStatuses: SIGNUP_LOCAL_ERROR_STATUSES },
  })
}
