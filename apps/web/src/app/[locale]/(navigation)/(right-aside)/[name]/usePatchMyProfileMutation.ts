'use client'

import type { GETV1MeResponse, PATCHV1MeBody, PATCHV1MeResponse } from '@litomi/contracts'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'
import type { ProblemDetailsError } from '@/utils/fetch-response'

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
      const { data } = await fetchAPIData<PATCHV1MeResponse>('/api/v1/me', {
        method: 'PATCH',
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
