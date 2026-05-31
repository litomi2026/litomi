'use client'

import { LockKeyhole } from 'lucide-react'
import { useTranslations } from 'next-intl'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'
import { Link } from '@/i18n/navigation'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'

export default function Unauthorized() {
  const t = useTranslations('Library')

  return (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <div className="flex-1 flex items-center justify-center">
        <StatusState
          description={t('empty.ratingUnauthorizedDescription')}
          icon={<LockKeyhole className="size-8" />}
          intent="auth"
          title={t('empty.ratingUnauthorizedTitle')}
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
    </>
  )
}
