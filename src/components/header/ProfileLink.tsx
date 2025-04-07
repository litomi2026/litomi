'use client'

import useMeQuery from '@/query/useMeQuery'

import IconProfile from '../icons/IconProfile'
import SelectableLink from '../SelectableLink'

type Props = {
  className?: string
}

export default function ProfileLink({ className }: Props) {
  const { data: me } = useMeQuery()

  return me ? (
    <SelectableLink className={className} href={`/@${me.loginId}`} Icon={<IconProfile />}>
      프로필
    </SelectableLink>
  ) : (
    <ProfileLinkSkeleton />
  )
}

export function ProfileLinkSkeleton() {
  return (
    <SelectableLink className="hidden pointer-events-none text-zinc-700 sm:block" href="" Icon={<IconProfile />}>
      프로필
    </SelectableLink>
  )
}
