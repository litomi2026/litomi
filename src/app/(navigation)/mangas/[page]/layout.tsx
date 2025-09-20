import Link from 'next/link'

import type { LayoutProps } from '@/types/nextjs'

import IconFlame from '@/components/icons/IconFlame'
import LinkPending from '@/components/LinkPending'
import RandomLink from '@/components/RandomLink'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import ViewSliderLink from '@/components/ViewSliderLink'
import { SourceParam } from '@/utils/param'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '../../ranking/common'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex flex-col gap-2 grow">
      <h1 className="sr-only">작품 목록</h1>
      <div className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm sm:justify-end md:text-base">
        <Link
          className="flex items-center gap-2 p-2 px-3 rounded-xl transition border-2 text-white hover:bg-zinc-900"
          href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`}
        >
          <LinkPending className="size-5">
            <IconFlame className="size-5" />
          </LinkPending>{' '}
          인기
        </Link>
        <ViewSliderLink />
        <RandomLink href={`/mangas/random/${SourceParam.K_HENTAI}/card`} />
      </div>
      <div className="flex justify-center whitespace-nowrap">
        <SourceTooltip />
      </div>
      {children}
    </main>
  )
}
