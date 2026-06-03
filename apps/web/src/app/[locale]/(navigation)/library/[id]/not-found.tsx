'use client'

import { LibraryBig } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

import { LibraryHeaderSpacer } from '../LibraryHeaderLayout'

export default function NotFound() {
  const t = useTranslations('Library.empty')

  return (
    <>
      <LibraryHeaderSpacer />
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
