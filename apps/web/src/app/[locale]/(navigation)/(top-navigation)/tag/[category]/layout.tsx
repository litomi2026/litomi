import { notFound } from 'next/navigation'

import { getLocaleFromParams } from '@/i18n/server'

import { getTagCategoryParam } from '../categories'
import TagPageHeader from '../TagPageHeader'

export default async function Layout({ children, params }: LayoutProps<'/[locale]/tag/[category]'>) {
  const locale = await getLocaleFromParams(params)
  const category = getTagCategoryParam((await params).category)

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
