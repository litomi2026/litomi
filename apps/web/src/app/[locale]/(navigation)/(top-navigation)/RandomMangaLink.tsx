'use client'

import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { Dices } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

import { Link, usePathname } from '@/i18n/navigation'
import { QueryKeys } from '@/lib/react-query/query-keys'

import RandomRefreshButton from './RandomRefreshButton'
import { topNavigationActionClassName } from './topNavigationActionConfig'

type Props = {
  timer?: number
}

export default function RandomMangaLink({ timer }: Props) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const isRandomPage = pathname === '/random'
  const t = useTranslations('TopNavigation.actions')
  const randomQueryKey = QueryKeys.proxyKRandomBase
  const isFetchingRandom = useIsFetching({ queryKey: randomQueryKey }) > 0

  if (!isRandomPage) {
    return (
      <Link className={twMerge('hover:bg-zinc-900 active:bg-background', topNavigationActionClassName)} href="/random">
        <Dices className="size-5" />
        <span className="min-w-9 text-center hidden sm:inline">{t('random')}</span>
      </Link>
    )
  }

  return (
    <RandomRefreshButton
      className={topNavigationActionClassName}
      isLoading={isFetchingRandom}
      onClick={() => queryClient.refetchQueries({ queryKey: randomQueryKey })}
      timer={timer}
    />
  )
}
