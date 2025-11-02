'use client'

import { Dices } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import RandomRefreshButton from './RandomRefreshButton'

const className = 'flex gap-1 items-center border-2 px-3 p-2 rounded-xl transition'

type Props = {
  timer?: number
}

export default function RandomMangaLink({ timer }: Props) {
  const pathname = usePathname()
  const isRandomPage = pathname === '/random'

  if (!isRandomPage) {
    return (
      <Link className={`hover:bg-zinc-900 active:bg-background ${className}`} href="/random">
        <Dices className="size-5" />
        <span className="min-w-9 text-center">랜덤</span>
      </Link>
    )
  }

  return <RandomRefreshButton className={className} timer={timer} />
}
