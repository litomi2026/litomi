'use client'

import { TURNSTILE_ORIGIN_PROTECTION_ACTION } from '@litomi/contracts'
import { env } from '@litomi/env/client'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { clearanceGate, VERIFICATION_REQUIRED_EVENT } from '@/lib/cloudflare/clearance'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_TURNSTILE_SITE_KEY } = env

export default function OriginProtectionTurnstile() {
  const [verificationRequired, setVerificationRequired] = useState(true)
  const turnstileRef = useRef<TurnstileInstance>(null)

  useEffect(() => {
    function showVerificationPrompt() {
      setVerificationRequired(true)
    }

    window.addEventListener(VERIFICATION_REQUIRED_EVENT, showVerificationPrompt)
    return () => {
      window.removeEventListener(VERIFICATION_REQUIRED_EVENT, showVerificationPrompt)
    }
  }, [])

  function handleSuccess(token: string) {
    if (!token) {
      return
    }

    void fetchAPIData<void>('/api/v1/turnstile/clearance', {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => {
        clearanceGate.markReady()
        setVerificationRequired(false)
      })
      .catch(() => {
        clearanceGate.releaseWait()
      })
  }

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={twMerge(
        'fixed right-3 bottom-[calc(4rem+var(--safe-area-bottom))] left-3 z-50 animate-fade-in-fast sm:right-4 sm:bottom-[calc(1rem+var(--safe-area-bottom))] sm:left-auto sm:w-88',
        verificationRequired
          ? 'pointer-events-auto overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-800/97 text-foreground backdrop-blur-xs'
          : 'pointer-events-none',
      )}
    >
      {verificationRequired && (
        <div className="flex items-start gap-3 p-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-brand/25 bg-brand/10 text-brand">
            <ShieldCheck className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-5 font-semibold">보안 확인이 필요해요</p>
            <p className="mt-0.5 text-xs leading-5 text-zinc-400">사람인지 확인하고 있어요</p>
          </div>
          <button
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-600 px-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-700 focus-visible:ring-2 active:border-zinc-600 active:bg-zinc-800 focus-visible:ring-brand/60 focus-visible:outline-none"
            onClick={() => turnstileRef.current?.reset()}
            title="보안 확인 다시 시도"
            type="button"
          >
            <RefreshCw className="size-3.5" />
            재시도
          </button>
        </div>
      )}
      <Turnstile
        className={twMerge(
          'relative z-10 overflow-auto',
          verificationRequired ? 'flex min-h-[89px] items-center justify-center px-2 py-2' : 'h-[89px] opacity-0',
        )}
        onBeforeInteractive={() => setVerificationRequired(true)}
        onError={clearanceGate.releaseWait}
        onSuccess={handleSuccess}
        options={{
          action: TURNSTILE_ORIGIN_PROTECTION_ACTION,
          appearance: 'interaction-only',
          responseField: false,
        }}
        ref={turnstileRef}
        siteKey={NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />
      {verificationRequired && <Loader2 className="absolute bottom-9 left-1/2 -translate-x-1/2 animate-spin z-0" />}
    </div>
  )
}
