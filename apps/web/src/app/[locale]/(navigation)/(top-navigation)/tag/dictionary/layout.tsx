import { getLocaleFromParams } from '@/i18n/server'

import TagPageHeader from '../TagPageHeader'

export default async function Layout({ children, params }: LayoutProps<'/[locale]/tag/dictionary'>) {
  const locale = await getLocaleFromParams(params)

  return (
    <>
      <TagPageHeader activeView="dictionary" locale={locale} />
      {children}
    </>
  )
}
