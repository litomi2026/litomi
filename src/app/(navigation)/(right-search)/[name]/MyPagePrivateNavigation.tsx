import { cookies } from 'next/headers'

import { getUserIdFromAccessToken } from '@/utils/cookie'

import { getUserById } from './common'
import MyPageNavigationLink from './MyPageNavigationLink'

type Props = {
  username: string
}

export default async function MyPagePrivateNavigation({ username }: Readonly<Props>) {
  const cookieStore = await cookies()
  const loginUserId = await getUserIdFromAccessToken(cookieStore, false)

  if (loginUserId) {
    const loginUser = await getUserById(loginUserId)

    if (loginUser.name !== username) {
      return
    }
  }

  const privateLinks = [
    { href: `/@${username}/censor`, label: '검열' },
    { href: `/@${username}/passkey`, label: '패스키' },
    { href: `/@${username}/password`, label: '비밀번호' },
  ]

  return (
    <>
      {privateLinks.map(({ href, label }) => (
        <MyPageNavigationLink href={href} key={href} label={label} />
      ))}
    </>
  )
}
