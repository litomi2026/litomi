import type { Metadata } from 'next'

import { PostFilter } from '@litomi/domain/post/filter'
import { type LucideIcon, Target, Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import StatusState from '@/components/status/StatusState'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import PostList from './MasonryPostList'
import { PostFilterParams, postFilterSchema } from './schema'

export async function generateMetadata({ params }: PageProps<'/[locale]/posts/[filter]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.community.posts' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/posts/recommend',
    }),
  }
}

const filterParamsToPostFilter = {
  [PostFilterParams.FOLLOWING]: PostFilter.FOLLOWING,
  [PostFilterParams.RECOMMEND]: PostFilter.RECOMMEND,
}

export async function generateStaticParams() {
  return [{ filter: PostFilterParams.RECOMMEND }, { filter: PostFilterParams.FOLLOWING }]
}

export default async function Page({ params }: PageProps<'/[locale]/posts/[filter]'>) {
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
