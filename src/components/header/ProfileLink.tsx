'use client'

import { SearchParamKey } from '@/constants/storage'
import useMeQuery from '@/query/useMeQuery'

import IconProfile from '../icons/IconProfile'
import SelectableLink from '../SelectableLink'

type Props = {
  className?: string
}

export default function ProfileLink({ className }: Readonly<Props>) {
  const { data: me } = useMeQuery()
  const loginId = me?.loginId

  const href = loginId ? `/@${loginId}` : `/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent('/@/')}`

  return (
    <SelectableLink className={className} href={href} Icon={<IconProfile />}>
      프로필
    </SelectableLink>
  )
}

export function ProfileLinkSkeleton() {
  return (
    <SelectableLink className="hidden pointer-events-none text-zinc-700 sm:block" href="" Icon={<IconProfile />}>
      프로필
    </SelectableLink>
  )
}
