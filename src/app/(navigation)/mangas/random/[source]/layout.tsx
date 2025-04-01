import type { BaseLayoutProps } from '@/types/nextjs'

import ShuffleButton from '@/components/ShuffleButton'
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
      <div className="flex justify-end items-center">
        <ShuffleButton
          action="refresh"
          className="flex gap-2 items-center w-fit border-2 px-3 py-2 rounded-xl transition border-zinc-800 hover:bg-zinc-800 active:bg-zinc-900"
          href={href}
          iconClassName="w-5"
        />
      </div>
      {children}
      <div className="flex justify-center items-center">
        <ShuffleButton
          action="refresh"
          className="flex gap-2 items-center w-fit border-2 px-3 py-2 rounded-xl transition border-zinc-800 hover:bg-zinc-800 active:bg-zinc-900"
          href={href}
          iconClassName="w-5"
        />
      </div>
    </main>
  )
}
