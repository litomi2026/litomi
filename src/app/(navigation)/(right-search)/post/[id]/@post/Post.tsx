import dayjs from 'dayjs'
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Repeat, Upload } from 'lucide-react'
import Link from 'next/link'

import { PostFilter } from '@/backend/api/v1/post/constant'
import PostCreationForm from '@/components/post/PostCreationForm'
import PostImages from '@/components/post/PostImages'
import ReferredPostCard from '@/components/post/ReferredPostCard'
import { type Post } from '@/components/post/XPostCard'
import Squircle from '@/components/ui/Squircle'

import FollowButton from './FollowButton'
import PostMangaCard from './PostMangaCard'

type Props = {
  post: Post
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
            <Squircle className="w-10 shrink-0" src={author?.imageURL}>
              {author?.nickname.slice(0, 2)}
            </Squircle>
            <div>
              <div aria-disabled={!author} className="font-semibold aria-disabled:text-zinc-500">
                {author?.nickname ?? '탈퇴한 사용자예요'}
              </div>
              {author && <div className="text-zinc-500">@{author.name}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMyPost && author && <FollowButton leader={author} />}
            <MoreHorizontal className="size-5 text-zinc-500" />
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
        <div className="flex items-center gap-1 text-zinc-500">
          <span>{dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}</span>
          <span>·</span>
          <span className="text-sm">
            <span className="font-bold text-foreground">{post.viewCount ?? 0}</span> 조회수
          </span>
        </div>
        <div className="flex justify-between gap-1 border-y-2 px-2 py-1 text-sm">
          {[
            {
              Icon: MessageCircle,
              content: post.commentCount ?? 0,
              iconClassName: 'group-hover:bg-brand/20',
              textClassName: 'hover:text-brand',
            },
            {
              Icon: Repeat,
              content: post.repostCount ?? 0,
              iconClassName: 'group-hover:bg-green-500/20 group-hover:text-green-500',
              textClassName: 'hover:text-green-500',
            },
            {
              Icon: Heart,
              content: post.likeCount ?? 0,
              iconClassName: 'group-hover:bg-red-600/20 group-hover:text-red-600',
              textClassName: 'hover:text-red-600',
            },
            {
              Icon: Bookmark,
              content: post.bookmarkCount ?? 0,
              iconClassName: 'group-hover:bg-sky-800/20',
              textClassName: 'hover:text-sky-500',
            },
            {
              Icon: Upload,
              iconClassName: 'group-hover:bg-zinc-800',
            },
          ].map(({ Icon, content, iconClassName = '', textClassName = '' }, i) => (
            <div className="flex items-center" key={i}>
              <button className={`group flex items-center w-fit transition ${textClassName}`}>
                <div className={`shrink-0 rounded-full transition ${iconClassName}`}>
                  <Icon className="size-10 p-2" />
                </div>
                {content}
              </button>
            </div>
          ))}
        </div>
        <PostCreationForm
          buttonText="답글"
          className="flex"
          filter={PostFilter.RECOMMAND} // TODO: 변경해야함
          isReply
          placeholder="답글 게시하기"
        />
      </div>
    </section>
  )
}
