'use client'

import LoginGate from '@/components/LoginGate'
import useMeQuery from '@/query/useMeQuery'

import DonationClient from './DonationClient'

export default function DonationAuthGate() {
  const { data: me } = useMeQuery()

  if (me === undefined) {
    return <DonationLoading />
  }

  if (me === null) {
    return <LoginGate />
  }

  return <DonationClient />
}

function DonationLoading() {
  return (
    <div className="max-w-3xl w-full mx-auto grid gap-4 p-6">
      <div className="h-4 w-40 rounded-full bg-zinc-900 animate-fade-in-fast" />
      <div className="w-full rounded-2xl bg-zinc-900 animate-fade-in-fast h-20" />
    </div>
  )
}
