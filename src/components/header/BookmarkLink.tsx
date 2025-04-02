'use client'

import useMeQuery from '@/query/useMeQuery'

import IconBookmark from '../icons/IconBookmark'
import SelectableLink from '../SelectableLink'

type Props = {
  className?: string
}

export default function BookmarkLink({ className }: Props) {
  const { data: user } = useMeQuery()

  return user ? (
    <SelectableLink className={className} href={`/${user.loginId}/bookmark`} Icon={<IconBookmark />}>
      북마크
    </SelectableLink>
  ) : (
    <BookmarkLinkSkeleton />
  )
}

export function BookmarkLinkSkeleton() {
  return (
    <SelectableLink className="hidden pointer-events-none text-zinc-700 sm:block" href="" Icon={<IconBookmark />}>
      북마크
    </SelectableLink>
  )
}
