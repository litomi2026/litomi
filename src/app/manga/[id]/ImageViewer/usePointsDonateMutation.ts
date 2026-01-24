import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  POSTV1PointsDonationCreateRequest,
  POSTV1PointsDonationCreateResponse,
} from '@/backend/api/v1/points/donations/POST'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling, type ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export default function usePointsDonateMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1PointsDonationCreateResponse, ProblemDetailsError, POSTV1PointsDonationCreateRequest>({
    mutationFn: async ({ totalAmount, recipients }) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/donations`
      const { data } = await fetchWithErrorHandling<POSTV1PointsDonationCreateResponse>(url, {
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
