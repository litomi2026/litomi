'use client'

import type { GETV1MeResponse, PATCHV1MeSettingsBody } from '@litomi/contracts'

import { patchUserSettings } from '@litomi/domain/utils/user-settings'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { BroadcastChannelKey, type UserSettingsBroadcastMessage } from '@/storage'
import { fetchAPIData, ProblemDetailsError } from '@/utils/api-request'

type MutationContext = {
  previousMe?: GETV1MeResponse | null
}

export default function usePatchMySettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ProblemDetailsError, PATCHV1MeSettingsBody, MutationContext>({
    mutationFn: async (body) => {
      const url = '/api/v1/me/settings'

      await fetchAPIData<void>(url, {
        method: 'PATCH',
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

      if (currentMe && typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(BroadcastChannelKey.USER_SETTINGS)

        channel.postMessage({
          userId: currentMe.id,
          settings: currentMe.settings,
        } satisfies UserSettingsBroadcastMessage)

        channel.close()
      }
    },
  })
}
