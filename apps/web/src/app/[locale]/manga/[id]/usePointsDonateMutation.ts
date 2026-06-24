import type { POSTV1PointsDonationCreateRequest, POSTV1PointsDonationCreateResponse } from '@litomi/contracts'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'
import type { ProblemDetailsError } from '@/utils/fetch-response'

export default function usePointsDonateMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1PointsDonationCreateResponse, ProblemDetailsError, POSTV1PointsDonationCreateRequest>({
    mutationFn: async ({ totalAmount, recipients }) => {
      const url = '/api/v1/points/donations'
      const { data } = await fetchAPIData<POSTV1PointsDonationCreateResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount, recipients }),
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points, exact: true })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactionsBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.myDonationsBase })
    },
  })
}
