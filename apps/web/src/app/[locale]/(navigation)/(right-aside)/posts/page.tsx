import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

export default async function Page({ params }: PageProps<'/[locale]/posts'>) {
  const locale = await getLocaleFromParams(params)
  redirect({ href: '/posts/recommend', locale })
}
