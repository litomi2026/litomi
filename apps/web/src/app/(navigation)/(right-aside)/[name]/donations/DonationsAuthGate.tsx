'use client'

import useMeQuery from '@/query/useMeQuery'

import DonationsClient from './DonationsClient'
import Forbidden from './Forbidden'
import Unauthorized from './Unauthorized'

type Props = {
  username: string
}

export default function DonationsAuthGate({ username }: Props) {
  const { data: me } = useMeQuery()

  if (me === undefined) {
    return <DonationsLoading />
  }

  if (!me) {
    return <Unauthorized />
  }

  if (me.name !== username) {
    return <Forbidden loginUsername={me.name} />
  }

  return <DonationsClient />
}

function DonationsLoading() {
  return (
    <div className="max-w-3xl w-full mx-auto grid gap-4 p-6">
      <div className="h-4 w-40 rounded-full bg-zinc-900 animate-fade-in-fast" />
      <div className="w-full rounded-2xl bg-zinc-900 animate-fade-in-fast h-20" />
    </div>
  )
}
