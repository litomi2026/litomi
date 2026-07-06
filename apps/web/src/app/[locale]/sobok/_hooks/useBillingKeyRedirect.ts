'use client'

import { useEffect, useEffectEvent } from 'react'
import { consumeBillingKeyRedirect } from '../_lib/billing'

interface Handlers {
  failedMessage: string
  onBillingKey: (billingKey: string) => void
  onError: (message: string) => void
}

// 모바일 빌링키 발급은 full-page redirect로 복귀한다. 복귀 시 저장된 결과를 1회 소비해
// 성공(billingKey)이면 onBillingKey로 이어가고, 실패면 onError로 알린다. 결제/구독 어느
// 진입점이든 같은 프로토콜이므로 이 훅 하나로 공유한다.
export default function useBillingKeyRedirect({ failedMessage, onBillingKey, onError }: Handlers) {
  const resume = useEffectEvent(() => {
    const result = consumeBillingKeyRedirect(failedMessage)

    if (!result) {
      return
    }

    if ('billingKey' in result) {
      onBillingKey(result.billingKey)
    } else {
      onError(result.errorMessage)
    }
  })

  useEffect(() => {
    resume()
  }, [])
}
