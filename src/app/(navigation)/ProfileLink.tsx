'use client'

import { User } from 'lucide-react'

import useMeQuery from '@/query/useMeQuery'

import SelectableLink from './SelectableLink'

type Props = {
  className?: string
}

export default function ProfileLink({ className }: Readonly<Props>) {
  const { data: me } = useMeQuery()
  const name = me?.name ?? ''

  return (
    <SelectableLink className={className} href={`/@${name}`} icon={<User />} selectedIconStyle="fill">
      내 리토미
    </SelectableLink>
  )
}
