'use client'

import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile'
import { Ref } from 'react'
import { toast } from 'sonner'

import { NEXT_PUBLIC_TURNSTILE_SITE_KEY } from '@/constants/env'

interface Props {
  className?: string
  onTokenChange: (token: string) => void
  options: Parameters<typeof Turnstile>[0]['options']
  token: string
  turnstileRef: Ref<TurnstileInstance | undefined>
}

export default function TurnstileWidget({ className = '', token, onTokenChange, turnstileRef, options }: Props) {
  return (
    <>
      <Turnstile
        className={`h-[71px] ${className}`}
        onError={() => {
          toast.error('Cloudflare 보안 검증에 실패했어요')
          onTokenChange('')
        }}
        onExpire={() => {
          toast.warning('Cloudflare 보안 검증이 만료됐어요')
          onTokenChange('')
        }}
        onSuccess={onTokenChange}
        options={options}
        ref={turnstileRef}
        siteKey={NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />
      <input name="cf-turnstile-response" type="hidden" value={token} />
    </>
  )
}
