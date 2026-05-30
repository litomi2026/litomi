import type { PostComment } from '@litomi/db/query/post-comment'

import { formatDistanceToNow } from '@litomi/std'
import dayjs from 'dayjs'
import { getLocale } from 'next-intl/server'

import { getPostDetailHref } from '@/components/post/postHref'
import Squircle from '@/components/ui/Squircle'
import { Link } from '@/i18n/navigation'

type Props = {
  comments: PostComment[]
}

export default async function CommentList({ comments }: Props) {
  const locale = await getLocale()

  if (comments.length === 0) {
    return (
      <section className="border-t px-4 py-8 text-center text-sm text-zinc-500">
        아직 답글이 없어요. 가장 먼저 남겨보세요.
      </section>
    )
  }

  return (
    <section aria-label="답글" className="border-t">
      <div className="px-4 pt-3 pb-2 text-sm font-semibold text-zinc-400">답글</div>
      <ol className="divide-y divide-zinc-900">
        {comments.map((comment) => {
          const author = comment.author

          const authorAvatar = (
            <Squircle className="w-10 shrink-0" src={author?.imageURL}>
              {(author?.nickname ?? '탈퇴').slice(0, 2)}
            </Squircle>
          )

          const authorMeta = (
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-5">
                <span className={`truncate text-[0.98rem] ${author ? 'font-bold text-zinc-100' : 'text-zinc-500'}`}>
                  {author?.nickname ?? '탈퇴한 사용자예요'}
                </span>
                {author && <span className="truncate text-[0.98rem] text-zinc-500">@{author.name}</span>}
              </div>
            </div>
          )

          return (
            <li className="px-4 py-3" key={comment.id}>
              <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5">
                {author ? (
                  <Link className="row-span-2 self-start" href={`/@${author.name}`} prefetch={false}>
                    {authorAvatar}
                  </Link>
                ) : (
                  <div className="row-span-2 self-start">{authorAvatar}</div>
                )}
                <div className="flex min-w-0 items-center gap-1.5">
                  {author ? (
                    <Link className="min-w-0" href={`/@${author.name}`} prefetch={false}>
                      {authorMeta}
                    </Link>
                  ) : (
                    <div className="min-w-0">{authorMeta}</div>
                  )}
                  <span className="text-zinc-500">·</span>
                  <span
                    className="shrink-0 whitespace-nowrap text-xs text-zinc-500"
                    title={dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                  >
                    {formatDistanceToNow(comment.createdAt, locale)}
                  </span>
                </div>
                <Link
                  className="min-w-0 whitespace-pre-wrap break-all text-[1.02rem] text-zinc-100 transition hover:text-zinc-200"
                  href={getPostDetailHref(comment.id)}
                  prefetch={false}
                >
                  {comment.content ?? '삭제된 답글이에요'}
                </Link>
              </article>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
