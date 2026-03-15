'use client'

import Cookies from 'js-cookie'

import { CookieKey } from '@/constants/storage'
import useMeQuery from '@/query/useMeQuery'

type NonAdultAdGateStatus = 'hidden' | 'loading' | 'visible'

export default function useNonAdultAdGate() {
  const { data: me, isPending } = useMeQuery()
  const hasAuthHint = Cookies.get(CookieKey.AUTH_HINT) === '1'
  let status: NonAdultAdGateStatus = 'visible'

  if (hasAuthHint && isPending) {
    status = 'loading'
  } else if (me?.adultVerification?.status === 'adult') {
    status = 'hidden'
  }

  return { me, status }
}
