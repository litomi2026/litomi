import type { POSTV1PointsDonationCreateRequest, POSTV1PointsDonationCreateResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, type ProblemDetailsError } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export default function usePointsDonateMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1PointsDonationCreateResponse, ProblemDetailsError, POSTV1PointsDonationCreateRequest>({
    mutationFn: async ({ totalAmount, recipients }) => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/points/donations`
      const { data } = await fetchAPIData<POSTV1PointsDonationCreateResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ totalAmount, recipients }),
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points, exact: true })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactions })
      queryClient.invalidateQueries({ queryKey: QueryKeys.myDonations })
    },
  })
}
