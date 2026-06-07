import type { Post as TPost } from '@litomi/contracts'

import { LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import { Bookmark, MessageCircle, Repeat, Upload } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import PostCreationForm from '@/components/post/PostCreationForm'
import { POST_DETAIL_CURRENT_ANCHOR_ID } from '@/components/post/postHref'
import PostImages from '@/components/post/PostImages'
import PostManagementMenu from '@/components/post/PostManagementMenu'
import ReferredPostCard from '@/components/post/ReferredPostCard'
import Squircle from '@/components/ui/Squircle'
import { Link } from '@/i18n/navigation'

import FollowButton from './FollowButton'
import PostDetailLikeButton from './PostDetailLikeButton'
import PostMangaCard from './PostMangaCard'

type Props = {
  post: TPost
}

export default async function Post({ post }: Props) {
  const locale = await getLocale()
  const t = await getTranslations('Community')
  const author = post.author
  const referredPost = post.referredPost

  const createdAtLabel = new Date(post.createdAt).toLocaleString(LOCALE_LANGUAGE_TAGS[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

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
              {author?.nickname ?? t('common.deletedUser')}
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
      {post.mangaId && <PostMangaCard catalogManga={post.manga} mangaId={post.mangaId} />}
      <div className="flex items-center gap-1 text-sm text-zinc-500">
        <span>{createdAtLabel}</span>
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
      <PostCreationForm
        buttonText={t('post.reply')}
        className="flex"
        parentPostId={post.id}
        placeholder={t('post.replyPlaceholder')}
      >
        {author && (
          <p className="text-left">
            <span className="font-semibold text-foreground">{t('post.replyingTo', { name: author.name })}</span>
          </p>
        )}
      </PostCreationForm>
    </article>
  )
}
