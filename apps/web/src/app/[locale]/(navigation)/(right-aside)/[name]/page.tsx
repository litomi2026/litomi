import type { Metadata } from 'next'

import { getUsernameFromParam } from '@litomi/std'
import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import NotFound from './not-found'
import { getPublicUserProfile } from './profile'
import UserPostList from './UserPostList'

export async function generateMetadata({ params }: PageProps<'/[locale]/[name]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.community.profile' })
  const { name } = await params
  const username = getUsernameFromParam(name)

  if (!username) {
    const title = t('indexTitle')
    const url = '/@'

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
  const title = profile ? t('title', { name: profile.name, nickname: profile.nickname }) : t('missingTitle')

  const description = profile
    ? t('description', { followerCount: profile.followerCount, followingCount: profile.followingCount })
    : t('missingDescription', { username })

  const url = `/@${profile?.name ?? username}`

  return {
    title,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: url,
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/[name]'>) {
  const { name } = await params
  const username = getUsernameFromParam(name)

  if (!username) {
    return
  }

  const profile = await getPublicUserProfile(username)

  if (!profile) {
    return <NotFound />
  }

  return <UserPostList username={username} />
}
