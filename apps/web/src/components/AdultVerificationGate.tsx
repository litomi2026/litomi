'use client'

import { ShieldAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

type Props = {
  description: ReactNode
}

export default function AdultVerificationGate({ description }: Props) {
  const t = useTranslations('Common.guard')

  return (
    <StatusState
      description={description}
      icon={<ShieldAlert className="size-8" />}
      intent="verify"
      title={t('adultVerificationRequired')}
    >
      <StatusActionLink href="/settings#adult">{t('anonymousAdultVerificationAction')}</StatusActionLink>
    </StatusState>
  )
}
