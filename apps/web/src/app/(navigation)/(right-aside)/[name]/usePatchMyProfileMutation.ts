'use client'

import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { GETV1MeResponse } from '@/backend/api/v1/me/GET'
import type { PATCHV1MeBody, PATCHV1MeResponse } from '@/backend/api/v1/me/PATCH'
import type { ProblemDetailsError } from '@/utils/react-query-error'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

type MutationContext = {
  previousMe?: GETV1MeResponse | null
}

type Params = {
  onError?: (
    error: ProblemDetailsError,
    variables: PATCHV1MeBody,
    context: MutationContext | undefined,
  ) => Promise<void> | void
  onSuccess?: (
    data: PATCHV1MeResponse,
    variables: PATCHV1MeBody,
    context: MutationContext | undefined,
  ) => Promise<void> | void
}

export default function usePatchMyProfileMutation({ onError, onSuccess }: Params = {}) {
  const queryClient = useQueryClient()

  return useMutation<PATCHV1MeResponse, ProblemDetailsError, PATCHV1MeBody, MutationContext>({
    mutationFn: async (body) => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me`

      const { data } = await fetchWithErrorHandling<PATCHV1MeResponse>(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      return data
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
          ...(patch.name && { name: patch.name }),
          ...(patch.nickname && { nickname: patch.nickname }),
          ...(patch.imageURL !== undefined && { imageURL: patch.imageURL }),
        }
      })

      return { previousMe }
    },

    onError: async (error, variables, context) => {
      if (context?.previousMe !== undefined) {
        queryClient.setQueryData(QueryKeys.me, context.previousMe)
      }

      await onError?.(error, variables, context)
    },

    onSuccess: async (data, variables, context) => {
      queryClient.setQueryData<GETV1MeResponse | null>(QueryKeys.me, (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          name: data.name,
          nickname: data.nickname,
          imageURL: data.imageURL,
        }
      })

      await onSuccess?.(data, variables, context)
    },

    meta: {
      suppressGlobalErrorToastForStatuses: [400, 409],
    },
  })
}
