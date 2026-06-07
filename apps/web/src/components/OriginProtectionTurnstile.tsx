'use client'

import { type POSTV1TurnstileClearanceResponse, TURNSTILE_ORIGIN_PROTECTION_ACTION } from '@litomi/contracts'
import { env } from '@litomi/env/client'
import { Turnstile } from '@marsidev/react-turnstile'

import {
  markOriginProtectionClearanceReady,
  releaseOriginProtectionClearanceWait,
} from '@/lib/origin-protection/clearance'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_TURNSTILE_SITE_KEY } = env

export default function OriginProtectionTurnstile() {
  function handleSuccess(token: string) {
    if (!token) {
      return
    }

    void fetchAPIData<POSTV1TurnstileClearanceResponse>('/api/v1/turnstile/clearance', {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => {
        markOriginProtectionClearanceReady()
      })
      .catch(() => {
        releaseOriginProtectionClearanceWait()
      })
  }

  return (
    <Turnstile
      className="fixed right-4 bottom-[calc(5rem+var(--safe-area-bottom))] z-50 sm:bottom-[calc(1rem+var(--safe-area-bottom))]"
      onError={releaseOriginProtectionClearanceWait}
      onSuccess={handleSuccess}
      options={{
        action: TURNSTILE_ORIGIN_PROTECTION_ACTION,
        appearance: 'interaction-only',
        responseField: false,
      }}
      siteKey={NEXT_PUBLIC_TURNSTILE_SITE_KEY}
    />
  )
}
