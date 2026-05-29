'use client'

import useMeQuery from '@/query/useMeQuery'

import Censorships from './Censorships'
import Forbidden from './Forbidden'
import Loading from './loading'
import Unauthorized from './Unauthorized'

type Props = {
  username: string
}

export default function CensorAuthGate({ username }: Props) {
  const { data: me } = useMeQuery()

  if (me === undefined) {
    return <Loading />
  }

  if (me === null) {
    return <Unauthorized />
  }

  if (username && me.name !== username) {
    return <Forbidden loginUsername={me.name} />
  }

  return <Censorships />
}
