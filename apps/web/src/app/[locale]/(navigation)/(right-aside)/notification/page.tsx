import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import NotificationPage from './NotificationPage'

export const dynamic = 'force-static'

export async function generateMetadata({ params }: PageProps<'/[locale]/notification'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.community.notification' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/notification',
    }),
  }
}

export default async function Page() {
  return (
    <Suspense>
      <NotificationPage />
    </Suspense>
  )
}
