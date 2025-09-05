import { getUserIdFromCookie } from '@/utils/cookie'

import { getUserById } from './common'
import MyPageNavigationLink from './MyPageNavigationLink'

type Props = {
  username: string
}

export default async function MyPagePrivateNavigation({ username }: Readonly<Props>) {
  const userId = await getUserIdFromCookie()

  if (userId && username) {
    const loginUser = await getUserById(userId)

    if (loginUser.name !== username) {
      return
    }
  }

  const privateLinks = [
    { href: `/@${username}/censor`, label: '검열' },
    { href: `/@${username}/settings`, label: '설정' },
  ]

  return (
    <>
      {privateLinks.map(({ href, label }) => (
        <MyPageNavigationLink href={href} key={href} label={label} />
      ))}
    </>
  )
}
