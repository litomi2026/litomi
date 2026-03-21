import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PostFilter } from '@/backend/api/v1/post/constant'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'

import PostList from './MasonryPostList'
import { PostFilterParams, postFilterSchema } from './schema'

export const dynamic = 'error'

export const metadata: Metadata = {
  title: '이야기',
  openGraph: {
    ...defaultOpenGraph,
    title: `이야기 - ${SHORT_NAME}`,
    url: '/posts/recommend',
  },
  alternates: {
    canonical: '/posts/recommend',
    languages: { ko: '/posts/recommend' },
  },
}

const filterParamsToPostFilter = {
  [PostFilterParams.FOLLOWING]: PostFilter.FOLLOWING,
  [PostFilterParams.RECOMMEND]: PostFilter.RECOMMEND,
}

export async function generateStaticParams() {
  return [{ filter: PostFilterParams.RECOMMEND }, { filter: PostFilterParams.FOLLOWING }]
}

export default async function Page({ params }: PageProps<'/posts/[filter]'>) {
  const validation = postFilterSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { filter } = validation.data
  const postFilter = filterParamsToPostFilter[filter]

  return <PostList filter={postFilter} NotFound={<EmptyState filter={filter} />} showMangaCover />
}

const emptyStateConfig = {
  [PostFilterParams.FOLLOWING]: {
    title: '팔로우한 사용자의 글이 없어요',
    description: '다른 사용자를 팔로우하거나 모든 글을 확인해보세요',
    icon: '👥',
  },
  [PostFilterParams.RECOMMEND]: {
    title: '추천 포스트가 없어요',
    description: '잠시 후 다시 확인해 주세요',
    icon: '🎯',
  },
}

function EmptyState({ filter }: { filter: PostFilterParams }) {
  const config = emptyStateConfig[filter]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div aria-label="empty state icon" className="text-4xl mb-4" role="img">
        {config.icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">{config.title}</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-sm">{config.description}</p>
    </div>
  )
}
