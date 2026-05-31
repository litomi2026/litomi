'use client'

import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState from '@/components/status/StatusState'
import { getStatusActionClassName } from '@/components/status/styles'
import { Link } from '@/i18n/navigation'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'

export default function NotFound() {
  const t = useTranslations('Library')

  return (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <div className="flex-1 flex items-center justify-center">
        <StatusState
          description={t('empty.ratingDescription')}
          icon={<Star className="size-8" />}
          title={t('empty.ratingTitle')}
        >
          <Link className={getStatusActionClassName('primary')} href="/library" prefetch={false}>
            {t('common.browseWorks')}
          </Link>
        </StatusState>
      </div>
    </>
  )
}
