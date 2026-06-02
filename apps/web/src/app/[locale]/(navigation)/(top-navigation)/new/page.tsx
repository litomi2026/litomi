import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

export default async function Page({ params }: PageProps<'/[locale]/new'>) {
  const locale = await getLocaleFromParams(params)
  redirect({ href: '/new/1', locale })
}
