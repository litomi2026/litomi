'use client'

import { FileQuestion } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  const t = useTranslations('Community.post')

  return (
    <StatusState
      description={t('notFoundDescription')}
      icon={<FileQuestion className="size-8" />}
      title={t('notFoundTitle')}
    >
      <StatusActionLink href="/posts/recommend">{t('notFoundAction')}</StatusActionLink>
    </StatusState>
  )
}
