import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { GETV1PointsDonationsMeResponse } from '@/backend/api/v1/points/donations/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling, type ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type MutationContext = {
  previous?: InfiniteData<GETV1PointsDonationsMeResponse>
}

type Variables = {
  donationId: number
}

export default function useDeleteDonationMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ProblemDetailsError, Variables, MutationContext>({
    mutationFn: async ({ donationId }) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/donations/${donationId}`
      await fetchWithErrorHandling<void>(url, { method: 'DELETE', credentials: 'include' })
    },
    onMutate: async ({ donationId }) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.myDonations })
      const previous = queryClient.getQueryData<InfiniteData<GETV1PointsDonationsMeResponse>>(QueryKeys.myDonations)

      if (previous) {
        queryClient.setQueryData<InfiniteData<GETV1PointsDonationsMeResponse>>(QueryKeys.myDonations, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== donationId),
          })),
        })
      }

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QueryKeys.myDonations, context.previous)
      }
      toast.error('삭제에 실패했어요')
    },
    onSuccess: () => {
      toast.success('삭제했어요')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.myDonations })
    },
  })
}
