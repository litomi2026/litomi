import { LockKeyhole } from 'lucide-react'
import { useTranslations } from 'next-intl'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'
import { Link } from '@/i18n/navigation'
import { getAuthRedirectHref } from '@/lib/auth-redirect'

export default function Unauthorized() {
  const t = useTranslations('Censorship')

  return (
    <StatusState
      description={t('unauthorized.description')}
      icon={<LockKeyhole className="size-8" />}
      intent="auth"
      title={t('unauthorized.title')}
    >
      <div className="flex w-full flex-col items-center gap-3">
        <LoginButton>{t('unauthorized.loginAction')}</LoginButton>
        <p className="text-sm text-zinc-500">
          {t('unauthorized.signupPrompt')}{' '}
          <Link
            className="text-zinc-300 underline transition hover:text-zinc-100"
            href={getAuthRedirectHref('/auth/signup', '/@/censor')}
            prefetch={false}
          >
            {t('unauthorized.signupAction')}
          </Link>
        </p>
      </div>
    </StatusState>
  )
}
