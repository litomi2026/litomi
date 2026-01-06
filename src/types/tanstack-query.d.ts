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
       * Enables the global `QueryCache.onError` handler to show a toast for this query.
       *
       * Query toasts are opt-in because queries often run in the background.
       */
      enableGlobalErrorToast?: boolean
      /**
       * Enables the global `QueryCache.onError` handler to show a toast only for matching HTTP statuses.
       */
      enableGlobalErrorToastForStatuses?: readonly number[]
      /**
       * Marks this query as requiring adult verification in KR. Useful for gating `enabled`
       * and for removing cached data when the adult gate flips from allowed → blocked.
       */
      requiresAdult?: boolean
    }
  }
}

export {}
