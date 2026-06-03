'use client'

import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState from '@/components/status/StatusState'
import { getStatusActionClassName } from '@/components/status/styles'
import { Link } from '@/i18n/navigation'

import { LibraryHeaderSpacer } from '../LibraryHeaderLayout'

export default function NotFound() {
  const t = useTranslations('Library')

  return (
    <>
      <LibraryHeaderSpacer />
      <div className="flex-1 flex items-center justify-center">
        <StatusState
          description={t('empty.historyDescription')}
          icon={<Clock className="size-8" />}
          title={t('empty.historyTitle')}
        >
          <Link className={getStatusActionClassName('primary')} href="/library" prefetch={false}>
            {t('common.browseWorks')}
          </Link>
        </StatusState>
      </div>
    </>
  )
}
