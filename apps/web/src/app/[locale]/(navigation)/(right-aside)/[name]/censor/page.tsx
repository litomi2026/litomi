import type { Metadata } from 'next'

import { getUsernameFromParam } from '@litomi/std'
import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import CensorAuthGate from './CensorAuthGate'

export async function generateMetadata({ params }: PageProps<'/[locale]/[name]/censor'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const { name } = await params
  const username = getUsernameFromParam(name)
  const pathname = username ? `/@${username}/censor` : '/@/censor'
  const t = await getTranslations({ locale, namespace: 'Metadata.community.censor' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname,
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/[name]/censor'>) {
  const { name } = await params
  const usernameFromParam = getUsernameFromParam(name)

  return <CensorAuthGate username={usernameFromParam} />
}
