import { Book } from 'lucide-react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import PostList from '@/app/(navigation)/(right-search)/posts/[filter]/PostList'
import { PostFilter } from '@/app/api/post/schema'
import PostCreationForm from '@/components/post/PostCreationForm'
import { CANONICAL_URL, defaultOpenGraph, SHORT_NAME } from '@/constants'

import { mangaSchema } from '../schema'

export const dynamic = 'error'

export async function generateMetadata({ params }: PageProps<'/manga/[id]/post'>): Promise<Metadata> {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  return {
    title: `${id} 이야기 - ${SHORT_NAME}`,
    openGraph: {
      ...defaultOpenGraph,
      title: `${id} 이야기 - ${SHORT_NAME}`,
      url: `${CANONICAL_URL}/manga/${id}/post`,
    },
  }
}

export default async function Page({ params }: PageProps<'/manga/[id]/post'>) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/75 backdrop-blur border-b-2 p-4">
        <h2 className="text-xl font-bold">이야기</h2>
      </div>
      <PostCreationForm
        buttonText="게시하기"
        className="flex p-4 border-b-2"
        filter={PostFilter.MANGA}
        mangaId={id}
        placeholder="이 작품은 어땠나요?"
      />
      <PostList filter={PostFilter.MANGA} mangaId={id} NotFound={<EmptyState />} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Book className="size-8 mb-4 text-brand-end" role="img" />
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">이 작품에 대한 글이 없어요</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-sm">첫 번째로 이 작품에 대해 이야기해보세요!</p>
    </div>
  )
}
