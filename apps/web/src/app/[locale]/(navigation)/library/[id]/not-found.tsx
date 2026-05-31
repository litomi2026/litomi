'use client'

import { LibraryBig } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'

export default function NotFound() {
  const t = useTranslations('Library.empty')

  return (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <StatusState
        description={t('libraryNotFoundDescription')}
        icon={<LibraryBig className="size-8" />}
        title={t('libraryNotFoundTitle')}
      >
        <StatusActionLink href="/library">{t('libraryNotFoundAction')}</StatusActionLink>
      </StatusState>
    </>
  )
}
