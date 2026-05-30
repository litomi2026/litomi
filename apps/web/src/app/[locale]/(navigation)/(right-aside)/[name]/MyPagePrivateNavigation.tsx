'use client'

import useMeQuery from '@/query/useMeQuery'

import MyPageNavigationLink from './MyPageNavigationLink'

type Props = {
  username: string
}

const privateLinks = [
  { path: 'censor', label: '검열' },
  { path: 'donations', label: '후원' },
  { path: 'settings', label: '설정' },
]

export default function MyPagePrivateNavigation({ username }: Props) {
  const { data: me } = useMeQuery()

  if (me === undefined) {
    return privateLinks.map(({ path }) => (
      <span aria-hidden className="flex min-w-16 items-center justify-center p-3" key={path}>
        <span className="h-5 w-8 animate-fade-in rounded bg-zinc-800" />
      </span>
    ))
  }

  if (me === null) {
    return <MyPageNavigationLink href="/@/settings" label="설정" />
  }

  if (me.name !== username) {
    return null
  }

  return privateLinks.map(({ path, label }) => (
    <MyPageNavigationLink href={`/@${username}/${path}`} key={path} label={label} />
  ))
}
