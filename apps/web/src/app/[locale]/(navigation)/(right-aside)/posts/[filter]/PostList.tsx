'use client'

import { PostFilter } from '@litomi/domain/post/filter'
import { Book, Frown, MessageSquare, Repeat, SquarePen, Target, Users } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { PostQuery } from '@/query/usePostsQuery'

import CloudProviderStatus from '@/components/CloudProviderStatus'
import PostCreationForm from '@/components/post/PostCreationForm'
import RetryGuidance from '@/components/RetryGuidance'
import StatusState from '@/components/status/StatusState'
import { Link } from '@/i18n/navigation'
import usePostInfiniteQuery from '@/query/usePostsQuery'
import { ProblemDetailsError } from '@/utils/fetch-response'

import FollowingUnauthorized from './FollowingUnauthorized'
import MasonryPostList, { MasonryPostListSkeleton } from './MasonryPostList'

type PostListSource =
  | { type: 'manga'; mangaId: number }
  | { type: 'timeline'; filter: PostFilter.FOLLOWING | PostFilter.RECOMMEND }
  | { type: 'userPosts'; username: string; viewer: PostListViewer }
  | { type: 'userReplies'; username: string; viewer: PostListViewer }

type PostListViewer = 'other' | 'pending' | 'self'

type Props = {
  source: PostListSource
}

export default function PostList({ source }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error, refetch } =
    usePostInfiniteQuery(getPostQuery(source))

  const posts = data?.pages.flatMap((page) => page.posts) ?? []
  const showMangaCover = shouldShowMangaCover(source)

  if (isLoading) {
    return <MasonryPostListSkeleton showMangaCover={showMangaCover} />
  }

  if (isError) {
    if (
      source.type === 'timeline' &&
      source.filter === PostFilter.FOLLOWING &&
      error instanceof ProblemDetailsError &&
      error.status === 401
    ) {
      return <FollowingUnauthorized />
    }

    return <ErrorState error={error} retry={refetch} />
  }

  if (posts.length === 0) {
    return <EmptyState source={source} />
  }

  return (
    <MasonryPostList
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      loadNextPage={fetchNextPage}
      posts={posts}
      showMangaCover={showMangaCover}
    />
  )
}

function EmptyState({ source }: { source: PostListSource }) {
  switch (source.type) {
    case 'manga':
      return <MangaEmptyState />
    case 'timeline':
      return <TimelineEmptyState filter={source.filter} />
    case 'userPosts':
      return <UserPostEmptyState viewer={source.viewer} />
    case 'userReplies':
      return <UserReplyEmptyState viewer={source.viewer} />
  }
}

function ErrorState({ error, retry }: { error: Error; retry: () => unknown }) {
  const locale = useLocale()
  const t = useTranslations('Community.posts')
  const commonT = useTranslations('Community.common')
  const [hasSystemIssues, setHasSystemIssues] = useState(false)

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 p-4">
      <div aria-label="error icon" className="mb-4" role="img">
        <Frown aria-hidden className="size-10 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">{t('loadErrorTitle')}</h3>

      <CloudProviderStatus locale={locale} onStatusUpdate={setHasSystemIssues} />
      <RetryGuidance errorMessage={error.message} hasSystemIssues={hasSystemIssues} />

      <button
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition mt-4"
        onClick={retry}
      >
        <Repeat className="size-4" />
        <span>{commonT('retry')}</span>
      </button>

      <div className="mt-6 text-xs text-zinc-600">
        {t('persistentProblemPrefix')}{' '}
        <Link className="underline hover:text-zinc-400" href="/posts/all" prefetch={false}>
          {t('browseOtherPosts')}
        </Link>
      </div>
    </div>
  )
}

function getPostQuery(source: PostListSource): PostQuery {
  switch (source.type) {
    case 'manga':
      return { filter: PostFilter.MANGA, mangaId: source.mangaId }
    case 'timeline':
      return { filter: source.filter }
    case 'userPosts':
      return { filter: PostFilter.USER, username: source.username }
    case 'userReplies':
      return { filter: PostFilter.USER_REPLY, username: source.username }
  }
}

function MangaEmptyState() {
  const mangaDetailT = useTranslations('MangaViewer.detail')

  return (
    <StatusState
      className="py-16"
      description={mangaDetailT('emptyPostsDescription')}
      icon={<Book className="size-8" />}
      title={mangaDetailT('emptyPostsTitle')}
    />
  )
}

function shouldShowMangaCover(source: PostListSource) {
  return source.type === 'timeline' || source.type === 'userPosts'
}

function TimelineEmptyState({ filter }: { filter: PostFilter.FOLLOWING | PostFilter.RECOMMEND }) {
  const communityPostsT = useTranslations('Community.posts')
  const title =
    filter === PostFilter.FOLLOWING ? communityPostsT('emptyFollowingTitle') : communityPostsT('emptyRecommendTitle')
  const description =
    filter === PostFilter.FOLLOWING
      ? communityPostsT('emptyFollowingDescription')
      : communityPostsT('emptyRecommendDescription')
  const Icon = filter === PostFilter.FOLLOWING ? Users : Target

  return <StatusState className="py-16" description={description} icon={<Icon className="size-8" />} title={title} />
}

function UserPostEmptyState({ viewer }: { viewer: PostListViewer }) {
  const profilePostsT = useTranslations('Profile.posts')

  if (viewer === 'pending') {
    return <div className="min-h-88 flex-1" />
  }

  if (viewer === 'other') {
    return (
      <StatusState
        description={profilePostsT('emptyOtherDescription')}
        icon={<SquarePen className="size-8" />}
        title={profilePostsT('emptyOtherTitle')}
      />
    )
  }

  return (
    <div className="flex grow flex-col">
      <PostCreationForm className="flex border-b p-4" placeholder={profilePostsT('createPlaceholder')} />
      <StatusState
        description={profilePostsT('emptyOwnDescription')}
        icon={<SquarePen className="size-8" />}
        title={profilePostsT('emptyOwnTitle')}
      />
    </div>
  )
}

function UserReplyEmptyState({ viewer }: { viewer: PostListViewer }) {
  const profileRepliesT = useTranslations('Profile.replies')

  if (viewer === 'pending') {
    return <div className="min-h-88 flex-1" />
  }

  const title = viewer === 'self' ? profileRepliesT('emptyOwnTitle') : profileRepliesT('emptyOtherTitle')
  const description =
    viewer === 'self' ? profileRepliesT('emptyOwnDescription') : profileRepliesT('emptyOtherDescription')

  return <StatusState description={description} icon={<MessageSquare className="size-8" />} title={title} />
}
