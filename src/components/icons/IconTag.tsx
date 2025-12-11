'use client'

import { Tag } from 'lucide-react'

type Props = {
  className?: string
  selected?: boolean
}

export default function IconTag({ className, selected }: Readonly<Props>) {
  return <Tag className={className} fill={selected ? 'currentColor' : 'none'} />
}
