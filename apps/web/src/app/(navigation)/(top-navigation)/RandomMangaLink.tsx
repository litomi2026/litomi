'use client'

import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { Dices } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { twMerge } from 'tailwind-merge'

import { QueryKeys } from '@/lib/react-query/query-keys'

import RandomRefreshButton from './RandomRefreshButton'
import { topNavigationActionClassName } from './topNavigationActionConfig'

type Props = {
  timer?: number
}

export default function RandomMangaLink({ timer }: Props) {
  const pathname = usePathname()
  const isRandomPage = pathname === '/random'
  const queryClient = useQueryClient()
  const isFetchingRandom = useIsFetching({ queryKey: QueryKeys.proxyKRandom, exact: true }) > 0

  if (!isRandomPage) {
    return (
      <Link
        className={twMerge('hover:bg-zinc-900 active:bg-background', topNavigationActionClassName)}
        href="/random"
        prefetch={false}
      >
        <Dices className="size-5" />
        <span className="min-w-9 text-center hidden sm:inline">랜덤</span>
      </Link>
    )
  }

  return (
    <RandomRefreshButton
      className={topNavigationActionClassName}
      isLoading={isFetchingRandom}
      onClick={() => queryClient.refetchQueries({ queryKey: QueryKeys.proxyKRandom, exact: true })}
      timer={timer}
    />
  )
}
