import type { BaseLayoutProps } from '@/types/nextjs'

import ShuffleButton from '@/components/ShuffleButton'
import SourceSliderLink from '@/components/SourceToggleLink'
import { validateSource } from '@/utils/param'
import { notFound } from 'next/navigation'

export default async function Layout({ params, children }: BaseLayoutProps) {
  const { source } = await params
  const sourceString = validateSource(source)

  if (!sourceString) {
    notFound()
  }

  const href = `/mangas/random/${sourceString}`

  return (
    <main className="grid gap-2">
      <div className="flex justify-end gap-2 text-sm sm:text-base">
        <SourceSliderLink currentSource={sourceString} />
        <ShuffleButton action="refresh" href={href} iconClassName="w-5" />
      </div>
      {children}
      <div className="flex justify-center items-center">
        <ShuffleButton action="refresh" href={href} iconClassName="w-5" />
      </div>
    </main>
  )
}
