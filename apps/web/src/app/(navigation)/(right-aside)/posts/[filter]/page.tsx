import { SHORT_NAME } from '@litomi/domain/app/metadata'
import { PostFilter } from '@litomi/domain/post/filter'
import { type LucideIcon, Target, Users } from 'lucide-react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import StatusState from '@/components/status/StatusState'
import { defaultOpenGraph } from '@/lib/metadata'

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

const emptyStateConfig: Record<PostFilterParams, { title: string; description: string; icon: LucideIcon }> = {
  [PostFilterParams.FOLLOWING]: {
    title: '팔로우한 사용자의 글이 없어요',
    description: '다른 사용자를 팔로우하거나 모든 글을 확인해보세요',
    icon: Users,
  },
  [PostFilterParams.RECOMMEND]: {
    title: '추천 포스트가 없어요',
    description: '잠시 후 다시 확인해 주세요',
    icon: Target,
  },
}

function EmptyState({ filter }: { filter: PostFilterParams }) {
  const config = emptyStateConfig[filter]
  const Icon = config.icon

  return (
    <StatusState
      className="py-16"
      description={config.description}
      icon={<Icon className="size-8" />}
      title={config.title}
    />
  )
}
