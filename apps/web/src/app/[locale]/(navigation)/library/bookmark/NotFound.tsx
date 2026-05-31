'use client'

import { Bookmark } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState from '@/components/status/StatusState'
import { getStatusActionClassName } from '@/components/status/styles'
import { Link } from '@/i18n/navigation'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'
import BookmarkImportButton from './BookmarkImportButton'
import BookmarkUploadButton from './BookmarkUploadButton'

export default function NotFound() {
  const t = useTranslations('Library')

  return (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <div className="flex-1 flex items-center justify-center">
        <StatusState
          description={t('empty.bookmarkDescription')}
          icon={<Bookmark className="size-8" />}
          title={t('empty.bookmarkTitle')}
        >
          <div className="flex w-full max-w-sm flex-col gap-3">
            <Link className={getStatusActionClassName('primary', 'max-w-none')} href="/library" prefetch={false}>
              {t('common.browseWorks')}
            </Link>
            <BookmarkUploadButton variant="cta" />
            <BookmarkImportButton variant="cta" />
          </div>
        </StatusState>
      </div>
    </>
  )
}
