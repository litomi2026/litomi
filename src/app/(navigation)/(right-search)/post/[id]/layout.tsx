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
          <BackButton />
          <h2 className="text-xl font-bold">게시물</h2>
        </div>
        <button className="rounded-full border-2 border-zinc-600 px-4 py-1 font-bold mx-2">답글</button>
      </div>
      {post}
      {comment}
    </>
  )
}
