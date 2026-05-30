import { redirect } from 'next/navigation'

import { getLocaleFromParams } from '@/i18n/server'

export default async function Page({ params }: PageProps<'/[locale]/posts'>) {
  const locale = await getLocaleFromParams(params)
  redirect(`/${locale}/posts/recommend`)
}
