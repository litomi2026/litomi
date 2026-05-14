'use client'

import { showAdultVerificationRequiredToast, showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'

export default function useAdultAccessGuard() {
  const { data: me } = useMeQuery()
  const adultState = getAdultState(me)
  const canAccess = hasAdultAccess(adultState)

  function guardLogin() {
    if (me === undefined) {
      return false
    }

    if (me === null) {
      showLoginRequiredToast()
      return false
    }

    return true
  }

  function guardAdultAccess() {
    if (me === undefined) {
      return false
    }

    if (me === null) {
      showLoginRequiredToast()
      return false
    }

    if (!canAccess) {
      showAdultVerificationRequiredToast({ username: me.name })
      return false
    }

    return true
  }

  return {
    adultState,
    canAccess,
    guardAdultAccess,
    guardLogin,
    me,
  }
}
