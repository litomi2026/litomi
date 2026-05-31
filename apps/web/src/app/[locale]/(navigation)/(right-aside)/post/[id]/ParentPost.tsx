import type { Post as TPost } from '@litomi/contracts'

import { formatDistanceToNow } from '@litomi/std'
import dayjs from 'dayjs'
import { getLocale, getTranslations } from 'next-intl/server'

import { getPostDetailHref } from '@/components/post/postHref'
import ReferredPostCard from '@/components/post/ReferredPostCard'
import Squircle from '@/components/ui/Squircle'
import { Link } from '@/i18n/navigation'

type Props = {
  post: TPost
}

export default async function ParentPost({ post }: Props) {
  const locale = await getLocale()
  const t = await getTranslations('Community')
  const author = post.author
  const referredPost = post.referredPost

  const avatar = (
    <Squircle className="w-10 shrink-0" src={author?.imageURL}>
      {(author?.nickname ?? t('common.deletedUserShort')).slice(0, 2)}
    </Squircle>
  )

  return (
    <article className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 px-4 pt-3">
      <div className="flex flex-col items-center self-stretch">
        {author ? (
          <Link
            aria-label={t('common.profileAria', { nickname: author.nickname })}
            href={`/@${author.name}`}
            prefetch={false}
          >
            {avatar}
          </Link>
        ) : (
          <div>{avatar}</div>
        )}
        <div aria-hidden className="mt-2 w-0.5 flex-1 rounded-full bg-zinc-800" />
      </div>

      <div className="min-w-0 pb-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm leading-5">
          {author ? (
            <Link
              className="min-w-0 font-bold text-zinc-100 transition hover:text-zinc-200"
              href={`/@${author.name}`}
              prefetch={false}
            >
              <span className="break-all">{author.nickname}</span>
            </Link>
          ) : (
            <span className="font-bold text-zinc-500">{t('common.deletedUser')}</span>
          )}
          {author && <span className="min-w-0 break-all text-zinc-500">@{author.name}</span>}
          <span className="text-zinc-500">·</span>
          <span className="shrink-0 text-xs text-zinc-500" title={dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}>
            {formatDistanceToNow(new Date(post.createdAt), locale)}
          </span>
        </div>

        <Link
          className="mt-1 block min-w-0 rounded-md outline-offset-4 transition hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700/70"
          href={getPostDetailHref(post.id)}
          prefetch={false}
        >
          <p className="min-w-0 whitespace-pre-wrap break-all text-[0.98rem] leading-relaxed text-zinc-100">
            {post.content || <span className="text-zinc-500">{t('common.deletedPost')}</span>}
          </p>
        </Link>

        {referredPost && (
          <div className="mt-2">
            <ReferredPostCard referredPost={referredPost} />
          </div>
        )}

        {post.mangaId && (
          <Link
            className="mt-2 inline-flex rounded-full border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-200"
            href={`/manga/${post.mangaId}`}
            prefetch={false}
          >
            {t('post.viewRelatedWork')}
          </Link>
        )}
      </div>
    </article>
  )
}
