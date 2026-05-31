import { getPostDetailHref } from '@/components/post/postHref'
import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

export default async function Page({ params }: PageProps<'/[locale]/post'>) {
  const locale = await getLocaleFromParams(params)
  redirect({ href: getPostDetailHref(1), locale })
}
