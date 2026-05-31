'use client'

import { useTranslations } from 'next-intl'

import useMeQuery from '@/query/useMeQuery'

import MyPageNavigationLink from './MyPageNavigationLink'

type Props = {
  username: string
}

const privateLinks = [
  { labelKey: 'censor', path: 'censor' },
  { labelKey: 'donations', path: 'donations' },
] as const

export default function MyPagePrivateNavigation({ username }: Props) {
  const { data: me } = useMeQuery()
  const t = useTranslations('Profile.navigation')

  if (me === undefined) {
    return privateLinks.map(({ path }) => (
      <span aria-hidden className="flex min-w-16 items-center justify-center p-3" key={path}>
        <span className="h-5 w-8 animate-fade-in rounded bg-zinc-800" />
      </span>
    ))
  }

  if (me === null) {
    return null
  }

  if (me.name !== username) {
    return null
  }

  return privateLinks.map(({ labelKey, path }) => (
    <MyPageNavigationLink href={`/@${username}/${path}`} key={path} label={t(labelKey)} />
  ))
}
