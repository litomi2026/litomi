import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { Bookmark, MessageCircle, Repeat, Upload } from 'lucide-react'
import Link from 'next/link'

import { type Post as TPost } from '@/backend/api/v1/post/GET'
import PostCreationForm from '@/components/post/PostCreationForm'
import { POST_DETAIL_CURRENT_ANCHOR_ID } from '@/components/post/postHref'
import PostImages from '@/components/post/PostImages'
import PostManagementMenu from '@/components/post/PostManagementMenu'
import ReferredPostCard from '@/components/post/ReferredPostCard'
import Squircle from '@/components/ui/Squircle'

import FollowButton from './FollowButton'
import PostDetailLikeButton from './PostDetailLikeButton'
import PostMangaCard from './PostMangaCard'

type Props = {
  post: TPost
}

export default function Post({ post }: Props) {
  const author = post.author
  const referredPost = post.referredPost

  return (
    <article
      className="relative flex scroll-mt-[calc(3.5rem+var(--safe-area-top))] flex-col gap-4 px-4 py-3 sm:scroll-mt-14"
      id={POST_DETAIL_CURRENT_ANCHOR_ID}
    >
      <div className="flex items-start justify-between gap-2">
        <Link className="flex gap-2" href={`/@${author?.name ?? ''}`}>
          <Squircle className="w-10 shrink-0" src={author?.imageURL}>
            {author?.nickname.slice(0, 2)}
          </Squircle>
          <div>
            <div aria-disabled={!author} className="font-semibold aria-disabled:text-zinc-500">
              {author?.nickname ?? '탈퇴한 사용자예요'}
            </div>
            {author && <div className="text-zinc-500">@{author.name}</div>}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {author && <FollowButton leader={author} />}
          <PostManagementMenu
            authorId={author?.id}
            className="rounded-full p-1 transition hover:bg-zinc-800"
            fallbackUrl="/posts/recommend"
            postId={post.id}
            redirectOnDelete
          />
        </div>
      </div>
      <p className="min-w-0 whitespace-pre-wrap break-all text-lg">{post.content}</p>
      {post.imageURLs && <PostImages className="w-full overflow-hidden border" urls={post.imageURLs} />}
      {referredPost && <ReferredPostCard referredPost={referredPost} />}
      {post.mangaId && (
        <Link
          className="flex gap-3 rounded-lg border-2 border-zinc-700 bg-zinc-800/50 p-3 transition hover:bg-zinc-800 hover:border-zinc-600"
          href={`/manga/${post.mangaId}`}
          prefetch={false}
        >
          <PostMangaCard mangaId={post.mangaId} />
        </Link>
      )}
      <div className="flex items-center gap-1 text-sm text-zinc-500">
        <span>{dayjs(post.createdAt).locale('ko').format('YYYY년 M월 D일 A h:mm')}</span>
        {/* <span>·</span>
          <span className="text-sm">
            <span className="font-bold text-foreground">{post.viewCount ?? 0}</span> 조회수
          </span> */}
      </div>
      <div className="flex justify-between gap-1 border-y px-2 py-1 text-sm">
        <div className="flex items-center">
          <button className="group flex items-center w-fit transition hover:text-brand">
            <div className="shrink-0 rounded-full transition group-hover:bg-brand/20">
              <MessageCircle className="size-9 sm:size-10 p-2" />
            </div>
            {post.commentCount}
          </button>
        </div>
        <div className="flex items-center">
          <button className="group flex items-center w-fit transition hover:text-green-500">
            <div className="shrink-0 rounded-full transition group-hover:bg-green-500/20 group-hover:text-green-500">
              <Repeat className="size-9 sm:size-10 p-2" />
            </div>
            {post.repostCount}
          </button>
        </div>
        <PostDetailLikeButton likeCount={post.likeCount} postId={post.id} />
        <div className="flex items-center">
          <button className="group flex items-center w-fit transition hover:text-sky-500">
            <div className="shrink-0 rounded-full transition group-hover:bg-sky-800/20">
              <Bookmark className="size-9 sm:size-10 p-2" />
            </div>
            {post.bookmarkCount ?? 0}
          </button>
        </div>
        <div className="flex items-center">
          <button className="group flex items-center w-fit transition">
            <div className="shrink-0 rounded-full transition group-hover:bg-zinc-800">
              <Upload className="size-9 sm:size-10 p-2" />
            </div>
          </button>
        </div>
      </div>
      <PostCreationForm buttonText="답글" className="flex" parentPostId={post.id} placeholder="답글 게시하기">
        {author && (
          <p className="text-left">
            <span className="font-semibold text-foreground">@{author.name} </span>
            에게 보내는 답글
          </p>
        )}
      </PostCreationForm>
    </article>
  )
}
