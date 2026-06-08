import type { GETV1PointsDonationsMeResponse } from '@litomi/contracts'

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'

import type { ProblemDetailsError } from '@/utils/fetch-response'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

type MutationContext = {
  previous?: InfiniteData<GETV1PointsDonationsMeResponse>
}

type Variables = {
  donationId: number
}

export default function useDeleteDonationMutation() {
  const locale = useLocale()
  const queryClient = useQueryClient()
  const myDonationsQueryKey = QueryKeys.myDonations(locale)

  return useMutation<void, ProblemDetailsError, Variables, MutationContext>({
    mutationFn: async ({ donationId }) => {
      const url = `/api/v1/points/donations/${donationId}`
      await fetchAPIData<void>(url, { method: 'DELETE' })
    },
    onMutate: async ({ donationId }) => {
      await queryClient.cancelQueries({ queryKey: myDonationsQueryKey })
      const previous = queryClient.getQueryData<InfiniteData<GETV1PointsDonationsMeResponse>>(myDonationsQueryKey)

      if (previous) {
        queryClient.setQueryData<InfiniteData<GETV1PointsDonationsMeResponse>>(myDonationsQueryKey, {
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
        queryClient.setQueryData(myDonationsQueryKey, context.previous)
      }
    },
    onSuccess: () => {
      toast.success('삭제했어요')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.myDonationsBase })
    },
  })
}
