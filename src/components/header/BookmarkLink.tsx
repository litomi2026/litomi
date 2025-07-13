'use client'

import { MyTab } from '@/app/api/my/schema'
import { SearchParamKey } from '@/constants/storage'
import useMeQuery from '@/query/useMeQuery'

import IconBookmark from '../icons/IconBookmark'
import SelectableLink from '../SelectableLink'

type Props = {
  className?: string
}

export default function BookmarkLink({ className }: Props) {
  const { data: me } = useMeQuery()
  const loginId = me?.loginId
  const redirectURL = `/api/my?tab=${MyTab.Bookmark}`

  const href = loginId
    ? `/@${loginId}/bookmark`
    : `/auth/login?${SearchParamKey.REDIRECT_URL}=${encodeURIComponent(redirectURL)}`

  return (
    <SelectableLink className={className} href={href} Icon={<IconBookmark />}>
      북마크
    </SelectableLink>
  )
}

export function BookmarkLinkSkeleton() {
  return (
    <SelectableLink className="pointer-events-none text-zinc-700" href="" Icon={<IconBookmark />}>
      북마크
    </SelectableLink>
  )
}
