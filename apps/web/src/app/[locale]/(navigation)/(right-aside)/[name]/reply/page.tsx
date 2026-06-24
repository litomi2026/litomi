import { getUsernameFromParam } from '@litomi/std'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import NotFound from '../not-found'
import { getPublicUserProfile } from '../profile'
import UserReplyList from '../UserReplyList'

export async function generateMetadata({ params }: PageProps<'/[locale]/[name]/reply'>): Promise<Metadata> {
  const { name } = await params
  const username = getUsernameFromParam(name)
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.community.profile' })

  if (!username) {
    const title = t('repliesIndexTitle')
    const url = '/@/reply'

    return {
      title,
      ...generateLocalizedMetadata({
        title,
        locale,
        pathname: url,
      }),
    }
  }

  const profile = await getPublicUserProfile(username)
  const title = profile ? t('repliesTitle', { name: profile.name, nickname: profile.nickname }) : t('missingTitle')
  const description = profile ? t('repliesDescription') : t('missingDescription', { username })
  const url = `/@${profile?.name ?? username}/reply`

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: url,
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/[name]/reply'>) {
  const { name } = await params
  const username = getUsernameFromParam(name)

  if (!username) {
    return
  }

  const profile = await getPublicUserProfile(username)

  if (!profile) {
    return <NotFound />
  }

  return <UserReplyList username={username} />
}
