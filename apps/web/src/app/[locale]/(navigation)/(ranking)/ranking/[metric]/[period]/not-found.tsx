'use client'

import { Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '../../../common'

export default function NotFound() {
  const t = useTranslations('RankingPage.notFound')

  return (
    <StatusState description={t('description')} icon={<Trophy className="size-8" />} title={t('title')}>
      <StatusActionLink href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`}>{t('action')}</StatusActionLink>
    </StatusState>
  )
}
