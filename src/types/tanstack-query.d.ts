import '@tanstack/query-core'

declare module '@tanstack/query-core' {
  interface Register {
    mutationMeta: {
      /**
       * Prevents the global `MutationCache.onError` handler from showing a toast for matching HTTP statuses.
       *
       * Use this when you show a custom toast in a local mutation `onError`,
       * but still want global fallback toasts for other statuses (e.g. keep 500 global).
       */
      suppressGlobalErrorToastForStatuses?: readonly number[]
    }
    queryMeta: {
      /**
       * Prevents the global `QueryCache.onError` handler from showing a toast for matching HTTP statuses.
       */
      suppressGlobalErrorToastForStatuses?: readonly number[]
    }
  }
}

export {}
