'use client'

import { MessageSquareOff } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  const t = useTranslations('Profile.replies')

  return (
    <StatusState
      description={t('notFoundDescription')}
      icon={<MessageSquareOff className="size-8" />}
      title={t('notFoundTitle')}
    >
      <StatusActionLink href="/posts/recommend">{t('notFoundAction')}</StatusActionLink>
    </StatusState>
  )
}
