import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import LibraryItemsClient from './LibraryItemsClient'

const schema = z.object({
  id: z.coerce.number().int().positive(),
})

export async function generateMetadata({ params }: PageProps<'/[locale]/library/[id]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data
  const t = await getTranslations({ locale, namespace: 'Metadata.library.detail' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: `/library/${libraryId}`,
    }),
  }
}

export default async function LibraryDetailPage({ params }: PageProps<'/[locale]/library/[id]'>) {
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data

  return <LibraryItemsClient libraryId={libraryId} />
}
