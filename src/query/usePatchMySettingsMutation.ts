'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { GETV1MeResponse } from '@/backend/api/v1/me/GET'
import type { PATCHV1MeSettingsBody } from '@/backend/api/v1/me/settings/PATCH'

import { QueryKeys } from '@/constants/query'
import { LocalStorageKey } from '@/constants/storage'
import { env } from '@/env/client'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'
import { patchUserSettings } from '@/utils/user-settings'

const { NEXT_PUBLIC_API_ORIGIN } = env

type MutationContext = {
  previousMe?: GETV1MeResponse | null
}

export default function usePatchMySettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ProblemDetailsError, PATCHV1MeSettingsBody, MutationContext>({
    mutationFn: async (body) => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/settings`

      await fetchWithErrorHandling<void>(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    },

    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.me, exact: true })
      const previousMe = queryClient.getQueryData<GETV1MeResponse | null>(QueryKeys.me)

      queryClient.setQueryData<GETV1MeResponse | null>(QueryKeys.me, (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          settings: patchUserSettings(current.settings, patch),
        }
      })

      return { previousMe }
    },

    onError: (_error, _patch, context) => {
      if (context?.previousMe !== undefined) {
        queryClient.setQueryData(QueryKeys.me, context.previousMe)
      }
    },

    onSuccess: () => {
      const currentMe = queryClient.getQueryData<GETV1MeResponse | null>(QueryKeys.me)

      if (currentMe && typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            LocalStorageKey.USER_SETTINGS_SIGNAL,
            JSON.stringify({
              userId: currentMe.id,
              settings: currentMe.settings,
              at: Date.now(),
            }),
          )
        } catch {
          // 다른 탭 동기화 신호 기록 실패는 현재 탭 저장 성공에 영향을 주지 않아요.
        }
      }
    },
  })
}
