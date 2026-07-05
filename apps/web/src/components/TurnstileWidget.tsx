'use client'

import { env } from '@litomi/env/client'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Ref } from 'react'
import { toast } from 'sonner'

const { NEXT_PUBLIC_TURNSTILE_SITE_KEY } = env

interface Props {
  className?: string
  hasToken?: boolean
  id: string
  onTokenChange: (token: string) => void
  options: Parameters<typeof Turnstile>[0]['options']
  turnstileRef: Ref<TurnstileInstance | undefined>
}

export default function TurnstileWidget({ className = '', hasToken, id, onTokenChange, turnstileRef, options }: Props) {
  const t = useTranslations('Common.turnstile')

  return (
    <div className="h-[65px] flex items-center justify-center relative overflow-hidden">
      {!hasToken && (
        <Loader2 className="size-6 animate-spin absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" />
      )}
      <Turnstile
        className={`h-[65px] relative z-10 overflow-x-auto overflow-y-hidden scrollbar-hidden ${className}`}
        id={id}
        onError={() => {
          toast.error(t('failed'))
          onTokenChange('')
        }}
        onExpire={() => {
          toast.warning(t('expired'))
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
