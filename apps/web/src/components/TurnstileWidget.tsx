'use client'

import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile'
import { Loader2 } from 'lucide-react'
import { Ref } from 'react'
import { toast } from 'sonner'

import { env } from '@/env/client'

const { NEXT_PUBLIC_TURNSTILE_SITE_KEY } = env

interface Props {
  className?: string
  hasToken?: boolean
  onTokenChange: (token: string) => void
  options: Parameters<typeof Turnstile>[0]['options']
  turnstileRef: Ref<TurnstileInstance | undefined>
}

export default function TurnstileWidget({ className = '', hasToken, onTokenChange, turnstileRef, options }: Props) {
  return (
    <div className="h-[65px] flex items-center justify-center relative overflow-hidden">
      {!hasToken && (
        <Loader2 className="size-6 animate-spin absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" />
      )}
      <Turnstile
        className={`h-[65px] relative z-10 overflow-x-auto overflow-y-hidden scrollbar-hidden ${className}`}
        onError={() => {
          toast.error('Cloudflare 보안 검증에 실패했어요')
          onTokenChange('')
        }}
        onExpire={() => {
          toast.warning('Cloudflare 보안 검증이 만료됐어요')
          onTokenChange('')
        }}
        onSuccess={onTokenChange}
        options={{ ...options, responseField: false }}
        ref={turnstileRef}
        siteKey={NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />
    </div>
  )
}
