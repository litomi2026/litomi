import dayjs from 'dayjs'
import Link from 'next/link'

import PostCreationForm from '@/components/post/PostCreationForm'
import PostImages from '@/components/post/PostImages'
import PostManagementMenu from '@/components/post/PostManagementMenu'
import ReferredPostCard from '@/components/post/ReferredPostCard'
import { type Post } from '@/components/post/XPostCard'
import Squircle from '@/components/ui/Squircle'

import FollowButton from './FollowButton'
import PostDetailActionBar from './PostDetailActionBar'
import PostMangaCard from './PostMangaCard'

type Props = {
  post: Post
}

export default function Post({ post }: Props) {
  const author = post.author
  const referredPost = post.referredPost

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
        <div className="flex items-center gap-1 text-zinc-500">
          <span>{dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}</span>
          <span>·</span>
          <span className="text-sm">
            <span className="font-bold text-foreground">{post.viewCount ?? 0}</span> 조회수
          </span>
        </div>
        <PostDetailActionBar
          bookmarkCount={post.bookmarkCount ?? 0}
          commentCount={post.commentCount}
          likeCount={post.likeCount}
          postId={post.id}
          repostCount={post.repostCount}
        />
        <PostCreationForm
          buttonText="답글"
          className="flex"
          isReply
          parentPostId={post.id}
          placeholder="답글 게시하기"
        />
      </div>
    </section>
  )
}
