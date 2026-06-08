'use client'

import type { POSTV1AuthLogoutResponse } from '@litomi/contracts'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ProblemDetailsError } from '@/utils/fetch-response'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1AuthLogoutResponse, ProblemDetailsError>({
    mutationFn: async () => {
      const url = '/api/v1/auth/logout'
      const { data } = await fetchAPIData<POSTV1AuthLogoutResponse>(url, { method: 'POST' })
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
