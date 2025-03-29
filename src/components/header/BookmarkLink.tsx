'use client'

import useMeQuery from '@/query/useMeQuery'

import IconBookmark from '../icons/IconBookmark'
import SelectableLink from '../SelectableLink'

export default function BookmarkLink() {
  const { data: user } = useMeQuery()
  const { loginId } = user

  return (
    <SelectableLink className="hidden sm:block" href={`/${loginId}/bookmark`} Icon={IconBookmark}>
      북마크
    </SelectableLink>
  )
}

export function BookmarkLinkSkeleton() {
  return (
    <SelectableLink className="hidden pointer-events-none text-zinc-700 sm:block" href="" Icon={IconBookmark}>
      <div className="h-5 animate-fade-in rounded-full bg-zinc-700" />
    </SelectableLink>
  )
}
