'use client'

import useMeQuery from '@/query/useMeQuery'

import IconBookmark from '../icons/IconBookmark'
import SelectableLink from '../SelectableLink'

type Props = {
  className?: string
}

export default function BookmarkLink({ className }: Readonly<Props>) {
  const { data: me } = useMeQuery()
  const name = me?.name

  return (
    <SelectableLink className={className} href={`/@${name ?? ''}/bookmark`} Icon={IconBookmark}>
      북마크
    </SelectableLink>
  )
}
