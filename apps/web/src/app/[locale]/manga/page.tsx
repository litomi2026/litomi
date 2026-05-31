import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

export default async function Page({ params }: PageProps<'/[locale]/manga'>) {
  const locale = await getLocaleFromParams(params)
  return redirect({ href: '/manga/3542485', locale })
}
