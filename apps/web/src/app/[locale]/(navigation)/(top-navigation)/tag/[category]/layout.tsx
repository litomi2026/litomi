import { notFound } from 'next/navigation'

import { getLocaleFromParams } from '@/i18n/server'

import { TAG_CATEGORY_PARAMS } from '../categories'
import TagPageHeader from '../TagPageHeader'

export default async function Layout({ children, params }: LayoutProps<'/[locale]/tag/[category]'>) {
  const locale = await getLocaleFromParams(params)
  const { category: categoryParam } = await params
  const category = TAG_CATEGORY_PARAMS.find((item) => item === categoryParam)

  if (!category) {
    notFound()
  }

  return (
    <>
      <TagPageHeader activeView="tags" locale={locale} tagsHref={`/tag/${category}`} />
      {children}
    </>
  )
}
