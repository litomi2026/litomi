import { getUserIdFromCookie } from '@/utils/cookie'

import { getMe } from './common'
import MyPageNavigationLink from './MyPageNavigationLink'

type Props = {
  username: string
}

export default async function MyPagePrivateNavigation({ username }: Readonly<Props>) {
  const userId = await getUserIdFromCookie()

  if (userId && username) {
    const me = await getMe(userId)

    if (me.name !== username) {
      return
    }
  }

  const privateLinks = [
    { href: `/@${username}/censor`, label: '검열' },
    { href: `/@${username}/donations`, label: '기부' },
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
