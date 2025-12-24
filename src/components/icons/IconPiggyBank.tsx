'use client'

import { PiggyBank } from 'lucide-react'

type Props = {
  className?: string
  selected?: boolean
}

export default function IconPiggyBank({ className, selected }: Readonly<Props>) {
  return <PiggyBank className={className} fill={selected ? 'currentColor' : 'none'} />
}
