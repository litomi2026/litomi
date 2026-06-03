'use client'

import { LockKeyhole } from 'lucide-react'
import { useTranslations } from 'next-intl'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'
import { Link } from '@/i18n/navigation'

export default function Unauthorized() {
  const t = useTranslations('Community.notification')
  const commonT = useTranslations('Community.common')

  return (
    <StatusState
      description={t('auth.description')}
      icon={<LockKeyhole className="size-8" />}
      intent="auth"
      title={t('auth.title')}
    >
      <div className="flex w-full flex-col items-center gap-3">
        <LoginButton>{commonT('login')}</LoginButton>
        <p className="text-sm text-zinc-500">
          {commonT('signupPrompt')}{' '}
          <Link className="text-zinc-300 underline transition hover:text-zinc-100" href="/auth/signup" prefetch={false}>
            {commonT('signup')}
          </Link>
        </p>
      </div>
    </StatusState>
  )
}
