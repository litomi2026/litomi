import { notFound } from 'next/navigation'

import PostList from '@/app/(navigation)/(right-search)/posts/[filter]/PostList'
import { PostFilter } from '@/app/api/post/schema'
import PostCreationForm from '@/components/post/PostCreationForm'
import { PageProps } from '@/types/nextjs'

import { mangaSchema } from '../schema'

export const dynamic = 'error'

export default async function Page({ params }: PageProps) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 bg-background/75 backdrop-blur border-b-2 p-4">
        <h2 className="text-xl font-bold">망가 게시글 목록</h2>
      </div>
      <PostCreationForm
        buttonText="게시하기"
        className="flex p-4 border-b-2"
        filter={PostFilter.MANGA}
        mangaId={id}
        placeholder="이 작품은 어땠나요?"
      />
      <PostList filter={PostFilter.MANGA} mangaId={id} />
    </div>
  )
}
