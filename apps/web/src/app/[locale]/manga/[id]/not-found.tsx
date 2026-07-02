'use client'

import { SearchX } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  const t = useTranslations('MangaViewer.notFound')

  return (
    <StatusState
      className="min-h-dvh"
      description={t('description')}
      icon={<SearchX className="size-8" />}
      title={t('title')}
    >
      <StatusActionLink href="/new/1">{t('action')}</StatusActionLink>
    </StatusState>
  )
}
