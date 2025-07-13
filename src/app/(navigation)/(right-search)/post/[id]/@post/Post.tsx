import { Suspense } from '@suspensive/react'
import dayjs from 'dayjs'

import Icon3Dots from '@/components/icons/Icon3Dots'
import IconBookmark from '@/components/icons/IconBookmark'
import IconChart from '@/components/icons/IconChart'
import IconChat from '@/components/icons/IconChat'
import IconHeart from '@/components/icons/IconHeart'
import IconRepeat from '@/components/icons/IconRepeat'
import PostCreationForm, { PostCreationFormSkeleton } from '@/components/post/PostCreationForm'
import PostImages from '@/components/post/PostImages'
import ReferredPostCard from '@/components/post/ReferredPostCard'
import Squircle from '@/components/ui/Squircle'
import { type TPost } from '@/mock/post'

import FollowButton from './FollowButton'

type Props = {
  post: TPost
}

export default function Post({ post }: Readonly<Props>) {
  const author = post.author
  const referredPost = post.referredPost
  const isMyPost = false // userId === author?.id

  return (
    <section>
      {/* {post.parentPosts?.map((post) => <PostCard isThread key={post.id} post={post} />)} */}
      <div className="relative grid gap-4 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-2">
            <Squircle className="w-10 flex-shrink-0" src={author?.profileImageURLs?.[0]}>
              {author?.nickname.slice(0, 2)}
            </Squircle>
            <div>
              <div aria-disabled={!author} className="font-semibold aria-disabled:text-zinc-500">
                {author?.nickname ?? '탈퇴한 사용자입니다'}
              </div>
              {author && <div className="text-zinc-500">@{author.name}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMyPost && author && (
              <Suspense clientOnly>
                <FollowButton leader={author} />
              </Suspense>
            )}
            <Icon3Dots className="w-5 text-zinc-500" />
          </div>
        </div>
        <p className="min-w-0 whitespace-pre-wrap break-all text-lg">{post.content}</p>
        {post.imageURLs && (
          <PostImages className="w-full overflow-hidden border" initialPost={post} urls={post.imageURLs} />
        )}
        {referredPost && <ReferredPostCard referredPost={referredPost} />}
        <div className="flex items-center gap-1 text-zinc-500">
          <span>{dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}</span>
          <span>·</span>
          <span className="text-sm">
            <span className="font-bold">{101}</span> 조회수
          </span>
        </div>
        <div className="flex justify-between gap-1 border-y-2 px-2 py-1 text-sm">
          {[
            {
              Icon: IconChat,
              content: post.commentCount,
              iconClassName: 'group-hover:bg-zinc-800',
            },
            {
              Icon: IconRepeat,
              content: post.repostCount,
              iconClassName: 'group-hover:bg-green-500/20 group-hover:text-green-500',
              textClassName: 'hover:text-green-500',
            },
            {
              Icon: IconHeart,
              content: post.likeCount,
              iconClassName: 'group-hover:bg-red-500/20 group-hover:text-red-500',
              textClassName: 'hover:text-red-500',
            },
            {
              Icon: IconChart,
              content: post.viewCount,
              iconClassName: 'group-hover:bg-zinc-800',
            },
            {
              Icon: IconBookmark,
              iconClassName: 'group-hover:bg-zinc-800',
            },
          ].map(({ Icon, content, iconClassName = '', textClassName = '' }, i) => (
            <div className="flex items-center" key={i}>
              <button className={`group flex items-center transition ${textClassName}`}>
                <Icon className={`w-10 shrink-0 rounded-full p-2 transition ${iconClassName}`} selected={false} />
                {content}
              </button>
            </div>
          ))}
        </div>
        <Suspense clientOnly fallback={<PostCreationFormSkeleton />}>
          <PostCreationForm buttonText="답글" className="flex" isReply placeholder="답글 게시하기" />
        </Suspense>
      </div>
    </section>
  )
}
