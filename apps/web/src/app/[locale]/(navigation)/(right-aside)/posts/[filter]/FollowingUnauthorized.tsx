'use client'

import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'
import { Link } from '@/i18n/navigation'

export default function FollowingUnauthorized() {
  const t = useTranslations('Community')

  return (
    <div className="flex flex-col grow justify-center">
      <StatusState
        description={t('posts.followingUnauthorizedDescription')}
        icon={<Users className="size-8" />}
        intent="auth"
        title={t('posts.followingUnauthorizedTitle')}
      >
        <div className="flex flex-col w-full items-center gap-3">
          <LoginButton>{t('common.login')}</LoginButton>
          <p className="text-sm text-zinc-500">
            {t('common.signupPrompt')}{' '}
            <Link
              className="text-zinc-300 underline hover:text-zinc-100 transition"
              href="/auth/signup"
              prefetch={false}
            >
              {t('common.signup')}
            </Link>
          </p>
        </div>
      </StatusState>
    </div>
  )
}
