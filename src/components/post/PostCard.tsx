import dayjs from 'dayjs'
import Link from 'next/link'

import { TPost } from '@/mock/post'

import Icon3Dots from '../icons/Icon3Dots'
import IconBookmark from '../icons/IconBookmark'
import IconChart from '../icons/IconChart'
import IconChat from '../icons/IconChat'
import IconHeart from '../icons/IconHeart'
import IconLogout from '../icons/IconLogout'
import IconRepeat from '../icons/IconRepeat'
import Squircle from '../ui/Squircle'
import PostImages from './PostImages'
import ReferredPostCard from './ReferredPostCard'

type Props = {
  post: TPost
  isThread?: boolean
  className?: string
}

export default function PostCard({ post, isThread, className = '' }: Props) {
  const imageURLs = post.imageURLs
  const author = post.author
  const referredPost = post.referredPost

  return (
    <div
      className={`[&:has(.child:hover)]:bg-zinc-900 grid min-w-0 grid-cols-[auto_1fr] gap-2 px-4 pb-2 pt-3 transition ${className}`}
    >
      <div className="relative flex flex-col items-center gap-1">
        <Squircle className="w-10" src={author?.profileImageURLs?.[0]} textClassName="text-foreground">
          {author?.nickname.slice(0, 2) ?? '탈퇴'}
        </Squircle>
        {isThread && (
          <>
            <div className="h-full w-0.5 bg-zinc-700" />
            <div className="absolute -bottom-4 left-1/2 h-4 w-0.5 -translate-x-1/2 bg-zinc-700" />
          </>
        )}
      </div>
      <div className="grid gap-2">
        <div className="grid gap-3">
          <div className="flex min-w-0 justify-between gap-1">
            <div className="flex min-w-0 gap-2 whitespace-nowrap flex-wrap sm:flex-nowrap">
              <div
                aria-disabled={!author}
                className="min-w-0 overflow-hidden font-semibold aria-disabled:text-zinc-500"
              >
                {author?.nickname ?? '탈퇴한 사용자입니다'}
              </div>
              <div className="flex min-w-0 items-center gap-1 text-zinc-400">
                {author && (
                  <>
                    <div className="min-w-8 overflow-hidden">@{author.name}</div>
                    <span>·</span>
                  </>
                )}
                <div className="shrink-0 text-xs overflow-hidden">
                  {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
                  {post.updatedAt && <span> (수정됨)</span>}
                </div>
              </div>
            </div>
            <Icon3Dots className="w-5 text-zinc-600" />
          </div>
          <Link className="child" href={`/post/${post.id}`}>
            <p className="min-w-0 whitespace-pre-wrap break-all">{post.content}</p>
          </Link>
          {imageURLs && (
            <PostImages
              className="max-h-[512px] overflow-hidden border rounded-2xl"
              initialPost={post}
              urls={imageURLs}
            />
          )}
          {referredPost && <ReferredPostCard referredPost={referredPost} />}
        </div>
        <div className="flex flex-wrap gap-2 text-zinc-400">
          <div className="grid grow grid-cols-4 gap-1 text-sm">
            <div className="flex items-center">
              <IconChat className="w-9 shrink-0 p-2" />
              {post.commentCount}
            </div>
            <div className="flex items-center">
              <IconRepeat className="w-9 shrink-0 p-2" />
              {post.repostCount}
            </div>
            <div className="flex items-center">
              <IconHeart className="w-9 shrink-0 p-2" />
              {post.likeCount}
            </div>
            <div className="flex items-center">
              <IconChart className="w-9 shrink-0 p-2" />
              {post.viewCount}
            </div>
          </div>
          <div className="flex">
            <IconBookmark className="w-9 p-2" selected={false} />
            <IconLogout className="w-9 -rotate-90 p-2" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function PostSkeleton() {
  return <div className="animate-fade-in bg-zinc-700 h-80 m-2 rounded-xl" />
}
