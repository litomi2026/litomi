'use client'

import Cookies from 'js-cookie'

import { CookieKey } from '@/constants/storage'
import useMeQuery from '@/query/useMeQuery'
import { AdultState, getAdultState } from '@/utils/adult-verification'

export type NonAdultAdGateStatus = 'hidden' | 'loading' | 'visible'

export default function useNonAdultGate() {
  const { data: me, isPending } = useMeQuery()
  const hasAuthHint = Cookies.get(CookieKey.AUTH_HINT) === '1'
  const adultState = getAdultState(me)

  if (hasAuthHint && isPending) {
    return AdultState.UNRESOLVED
  }

  if (adultState === AdultState.ADULT) {
    return AdultState.ADULT
  }

  return AdultState.NOT_ADULT
}
