import dayjs from 'dayjs'
import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { ComponentProps } from 'react'

import Squircle from '../ui/Squircle'
import PostActionButtons from './PostActionButtons'
import PostImages from './PostImages'
import ReferredPostCard, { ReferredPost } from './ReferredPostCard'

export type Post = {
  id: number
  createdAt: Date
  updatedAt?: Date
  content?: string | null
  imageURLs?: string[] | null
  mangaId?: number | null
  author?: {
    id: number
    name: string
    nickname: string
    imageURL: string | null
  } | null
  commentCount: number
  repostCount: number
  likeCount: number
  bookmarkCount?: number
  viewCount?: number
  referredPost?: ReferredPost | null
}

type Props = ComponentProps<'li'> & {
  className?: string
  post: Post
  isThread?: boolean
}

export default function PostCard({ post, isThread, className = '', ...props }: Readonly<Props>) {
  const author = post.author
  const referredPost = post.referredPost
  const imageURLs = post.imageURLs

  return (
    <li
      className={`[&:has(.child:hover)]:bg-zinc-900 grid min-w-0 grid-cols-[auto_1fr] gap-2 px-4 pb-2 pt-3 transition ${className}`}
      {...props}
    >
      <div className="relative flex flex-col items-center gap-1">
        <Squircle className="w-10" src={author?.imageURL} textClassName="text-foreground">
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
                </div>
              </div>
            </div>
            <MoreHorizontal className="size-5 text-zinc-600" />
          </div>
          <Link className="child" href={`/post/${post.id}`}>
            <p className="min-w-0 whitespace-pre-wrap break-all line-clamp-6">{post.content}</p>
          </Link>
          {imageURLs && <PostImages className="max-h-[512px] overflow-hidden border rounded-2xl" urls={imageURLs} />}
          {referredPost && <ReferredPostCard referredPost={referredPost} />}
        </div>
        <PostActionButtons
          commentCount={post.commentCount}
          likeCount={post.likeCount}
          postId={post.id}
          repostCount={post.repostCount}
          viewCount={post.viewCount}
        />
      </div>
    </li>
  )
}

export function PostSkeleton() {
  return <div className="animate-fade-in bg-zinc-700 h-80 m-2 rounded-xl" />
}
