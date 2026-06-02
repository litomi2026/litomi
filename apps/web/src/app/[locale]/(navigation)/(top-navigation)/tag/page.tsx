import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import TagPageClient from './TagPageClient'

export async function generateMetadata({ params }: PageProps<'/[locale]/tag'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.explore.tag' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/tag',
    }),
  }
}

export default function Page() {
  return (
    <Suspense>
      <TagPageClient />
    </Suspense>
  )
}
