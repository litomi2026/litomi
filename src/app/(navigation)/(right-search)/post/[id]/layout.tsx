import type { BaseLayoutProps } from '@/types/nextjs'
import type { ReactNode } from 'react'

import BackButton from '@/components/BackButton'

type LayoutProps = BaseLayoutProps & {
  comment: ReactNode
  post: ReactNode
}

export default function Layout({ post, comment }: LayoutProps) {
  return (
    <>
      <div className="sticky top-0 left-0 right-0 z-10 flex items-center justify-between gap-2 p-2 backdrop-blur whitespace-nowrap bg-background/70">
        <div className="flex items-center gap-8">
          <BackButton className="hover:bg-zinc-500/20 hover:dark:bg-zinc-500/50 focus-visible:outline-zinc-500 focus:dark:outline-zinc-200 rounded-full p-2 transition" />
          <h2 className="text-xl font-bold">게시물</h2>
        </div>
        <button className="rounded-full border-2 border-zinc-600 px-4 py-1 text-sm font-bold mx-2">답글</button>
      </div>
      <h2 className="text-center font-bold text-xl text-yellow-300 py-4">준비 중입니다</h2>
      {post}
      {comment}
    </>
  )
}
