import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import BookmarkPageClient from './page.client'

export async function generateMetadata({ params }: PageProps<'/[locale]/library/bookmark'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.library.bookmark' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/library/bookmark',
    }),
  }
}

export default function Page() {
  return <BookmarkPageClient />
}
