'use client'

import { Folder } from 'lucide-react'

import SelectableLink from '../SelectableLink'

type Props = {
  className?: string
}

export default function LibraryLink({ className }: Readonly<Props>) {
  return (
    <SelectableLink className={className} href={`/library`} Icon={Folder}>
      라이브러리
    </SelectableLink>
  )
}
