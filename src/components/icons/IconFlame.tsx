'use client'

import { Flame } from 'lucide-react'

type Props = {
  className?: string
  selected?: boolean
}

export default function IconFlame({ className, selected }: Readonly<Props>) {
  return <Flame className={className} fill={selected ? 'currentColor' : 'none'} />
}
