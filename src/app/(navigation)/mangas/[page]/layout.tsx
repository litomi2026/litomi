import type { LayoutProps } from '@/types/nextjs'

import ShuffleButton from '@/components/ShuffleButton'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import ViewSliderLink from '@/components/ViewSliderLink'
import { SourceParam } from '@/utils/param'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex flex-col gap-2 grow">
      <h1 className="sr-only">작품 목록</h1>
      <div className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm sm:justify-end md:text-base">
        <ViewSliderLink />
        <ShuffleButton
          action="navigate"
          className="w-fit"
          href={`/mangas/random/${SourceParam.HIYOBI}`}
          iconClassName="w-5"
        />
      </div>
      <div className="flex justify-center whitespace-nowrap">
        <SourceTooltip />
      </div>
      {children}
    </main>
  )
}
