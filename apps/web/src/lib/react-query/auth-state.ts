import type { QueryClient } from '@tanstack/react-query'

import { identify } from '@/lib/analytics/browser'
import { QueryKeys } from '@/lib/react-query/query-keys'

export function handleUnauthorizedError(queryClient: QueryClient) {
  queryClient.setQueryData(QueryKeys.me, null)

  queryClient.removeQueries({
    queryKey: QueryKeys.me,
    predicate: (query) => query.queryKey.length > 1,
  })

  identify(null)
}
