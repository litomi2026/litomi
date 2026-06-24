import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import { TAG_CATEGORY_PARAMS } from '../categories'
import TagCategoryPageClient from './page.client'

export const dynamicParams = false

export async function generateMetadata({ params }: PageProps<'/[locale]/tag/[category]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const { category: categoryParam } = await params
  const category = TAG_CATEGORY_PARAMS.find((item) => item === categoryParam)

  if (!category) {
    notFound()
  }

  const metadataT = await getTranslations({ locale, namespace: 'Metadata.explore.tag' })
  const tagT = await getTranslations({ locale, namespace: 'Tag' })
  const title = `${metadataT('title')} - ${tagT(`categories.${category}`)}`
  const description = metadataT('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: `/tag/${category}`,
    }),
  }
}

export function generateStaticParams() {
  return TAG_CATEGORY_PARAMS.map((category) => ({ category }))
}

export default async function Page({ params }: PageProps<'/[locale]/tag/[category]'>) {
  const { category: categoryParam } = await params
  const category = TAG_CATEGORY_PARAMS.find((item) => item === categoryParam)

  if (!category) {
    notFound()
  }

  return (
    <Suspense>
      <TagCategoryPageClient category={category} />
    </Suspense>
  )
}
