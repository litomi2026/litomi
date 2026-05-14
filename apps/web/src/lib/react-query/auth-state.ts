import type { QueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/browser'
import { identify } from '@/lib/analytics/browser'

export function handleUnauthorizedError(queryClient: QueryClient) {
  queryClient.setQueryData(QueryKeys.me, null)

  queryClient.removeQueries({
    queryKey: QueryKeys.me,
    predicate: (query) => query.queryKey.length > 1,
  })

  amplitude.reset()
  identify(null)
}
