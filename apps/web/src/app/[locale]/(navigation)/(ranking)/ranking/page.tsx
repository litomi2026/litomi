import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '../common'

export const dynamic = 'force-static'

export default async function Page({ params }: PageProps<'/[locale]/ranking'>) {
  const locale = await getLocaleFromParams(params)
  redirect({ href: `/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`, locale })
}
