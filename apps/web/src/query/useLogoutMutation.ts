'use client'

import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { POSTV1AuthLogoutResponse } from '@/backend/api/v1/auth/logout'

import { fetchWithErrorHandling, type ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export default function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1AuthLogoutResponse, ProblemDetailsError>({
    mutationFn: async () => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/auth/logout`

      const { data } = await fetchWithErrorHandling<POSTV1AuthLogoutResponse>(url, {
        method: 'POST',
        credentials: 'include',
      })

      return data
    },
    onSuccess: () => {
      queryClient.setQueryData(QueryKeys.me, null)

      queryClient.removeQueries({
        queryKey: QueryKeys.me,
        predicate: (query) => query.queryKey.length > 1,
      })
    },
  })
}
