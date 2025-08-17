'use client'

import { LibraryBig } from 'lucide-react'

type Props = {
  className?: string
  selected?: boolean
}

export default function IconLibraryBig({ className, selected }: Readonly<Props>) {
  return <LibraryBig className={className} fill={selected ? 'currentColor' : 'none'} />
}
