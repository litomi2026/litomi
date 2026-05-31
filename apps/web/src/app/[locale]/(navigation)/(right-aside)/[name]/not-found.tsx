'use client'

import { UserRoundX } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  const t = useTranslations('Profile.notFound')

  return (
    <StatusState description={t('description')} icon={<UserRoundX className="size-8" />} title={t('title')}>
      <StatusActionLink href="/posts/recommend">{t('action')}</StatusActionLink>
    </StatusState>
  )
}
