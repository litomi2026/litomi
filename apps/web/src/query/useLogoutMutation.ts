'use client'

import type { POSTV1AuthLogoutResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, type ProblemDetailsError } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export default function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1AuthLogoutResponse, ProblemDetailsError>({
    mutationFn: async () => {
      const url = new URL('/api/v1/auth/logout', NEXT_PUBLIC_API_ORIGIN)

      const { data } = await fetchAPIData<POSTV1AuthLogoutResponse>(url, {
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
