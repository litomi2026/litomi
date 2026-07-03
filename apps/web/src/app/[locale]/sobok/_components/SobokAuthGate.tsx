'use client'

import type { ReactNode } from 'react'
import LoginGate from '@/components/LoginGate'
import useMeQuery from '@/query/useMeQuery'

// Coarse login gate for the whole chat section. Auth lives entirely in the client (`useMeQuery`
// reads the auth-hint cookie, then hits the API) — the Next server never sees credentials, so it
// stays free of auth logic. Per-room ownership/subscription checks compose below this.
export default function SobokAuthGate({ children }: { children: ReactNode }) {
  const { data: me } = useMeQuery()

  if (me === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background animate-fade-in">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/50" />
      </div>
    )
  }

  if (me === null) {
    return <LoginGate />
  }

  return <>{children}</>
}
