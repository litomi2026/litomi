import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

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

export default async function Page({ params }: PageProps<'/[locale]/tag'>) {
  const locale = await getLocaleFromParams(params)
  redirect({ href: '/tag/female', locale })
}
