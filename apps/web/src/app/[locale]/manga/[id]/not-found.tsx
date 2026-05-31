import { SearchX } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default async function NotFound() {
  const t = await getTranslations('MangaViewer.notFound')

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
