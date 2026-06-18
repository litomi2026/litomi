import type { Post } from '@litomi/contracts'
import type { ReactNode } from 'react'

import { LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import { formatDistanceToNow, formatNumber } from '@litomi/std'
import dayjs from 'dayjs'
import { Heart, MessageCircle, Repeat } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import PostMangaCard from '@/app/[locale]/(navigation)/(right-aside)/post/[id]/PostMangaCard'
import { getPostDetailHref } from '@/components/post/postHref'
import PostManagementMenu from '@/components/post/PostManagementMenu'
import Squircle from '@/components/ui/Squircle'
import { Link } from '@/i18n/navigation'

const urlMatchRegex = /https?:\/\/[^\s]+/g
const trailingPunctuationRegex = /[.,!?;:)\]}]/

type Props = {
  post: Post
  showMangaCover?: boolean
}

export default function PostCard({ post, showMangaCover }: Props) {
  const locale = useLocale()
  const commonT = useTranslations('Community.common')
  const postT = useTranslations('Community.post')
  const postsT = useTranslations('Community.posts')

  const author = post.author
  const authorNickname = author?.nickname
  const content = post.content ?? ''
  const hasInternalURL = checkInternalURL(content)
  const isReply = post.parentPostId !== null

  const socialStats = [
    { Icon: MessageCircle, label: postT('comments'), value: post.commentCount },
    { Icon: Repeat, label: postT('reposts'), value: post.repostCount },
    { Icon: Heart, label: postT('likes'), value: post.likeCount },
  ].filter((stat) => stat.value > 0)

  const hasSocialStats = socialStats.length > 0

  const authorMeta = (
    <>
      <Squircle className="w-6 shrink-0" src={author?.imageURL} textClassName="text-foreground">
        {(authorNickname ?? commonT('deletedUserShort')).slice(0, 2)}
      </Squircle>
      <div className="ml-1 min-w-0 flex-1 truncate">
        {authorNickname ?? <span className="text-zinc-400">{commonT('deletedUser')}</span>}
      </div>
      <div
        className="shrink-0 overflow-hidden text-xs text-zinc-400"
        title={dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
      >
        {formatDistanceToNow(new Date(post.createdAt), locale)}
      </div>
    </>
  )

  return (
    <article className="relative w-full rounded-2xl border-2 bg-zinc-900 transition hover:bg-zinc-800/70 hover:border-zinc-700/70">
      {showMangaCover && post.mangaId && (
        <PostMangaCard catalogManga={post.manga} mangaId={post.mangaId} variant="cover" />
      )}
      <div className="flex min-w-0 flex-col">
        {hasInternalURL ? (
          <div className="p-3">
            <p className="min-w-0 whitespace-pre-wrap break-all text-sm leading-relaxed line-clamp-4 text-zinc-100">
              {isReply && <ReplyMarker label={postT('replies')} />}
              {renderTextWithLinks(content)}
            </p>
            <Link
              className="mt-2 inline-block text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
              href={getPostDetailHref(post.id)}
              prefetch={false}
            >
              {postsT('detailLink')}
            </Link>
          </div>
        ) : (
          <Link className="block p-3" href={getPostDetailHref(post.id)} prefetch={false}>
            <p className="min-w-0 whitespace-pre-wrap break-all text-sm leading-relaxed line-clamp-4 text-zinc-100">
              {isReply && <ReplyMarker label={postT('replies')} />}
              {content || <span className="text-zinc-400">{commonT('deletedPost')}</span>}
            </p>
          </Link>
        )}

        <div className={`flex items-center gap-2 pr-3 ${hasSocialStats ? 'pb-2' : 'pb-3'} text-xs text-zinc-400`}>
          {author ? (
            <Link
              className="flex min-w-0 flex-1 items-center gap-1 pl-3"
              href={`/@${author.name}`}
              prefetch={false}
              title={`@${author.name}`}
            >
              {authorMeta}
            </Link>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-1 pl-3">{authorMeta}</div>
          )}
          <PostManagementMenu
            authorId={author?.id}
            className="rounded-full p-1 -ml-1 -mr-2 transition hover:bg-zinc-800"
            postId={post.id}
          />
        </div>
        {hasSocialStats && (
          <Link
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-3 text-xs text-zinc-500"
            href={getPostDetailHref(post.id)}
            prefetch={false}
          >
            {socialStats.map(({ Icon, label, value }) => (
              <div
                className="flex items-center gap-1"
                key={label}
                title={`${label} ${value.toLocaleString(LOCALE_LANGUAGE_TAGS[locale])}`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="tabular-nums">{formatNumber(value, locale)}</span>
              </div>
            ))}
          </Link>
        )}
      </div>
    </article>
  )
}

export function PostSkeleton({ showMangaCover }: { showMangaCover?: boolean }) {
  if (showMangaCover) {
    return <div className="aspect-5/7 w-full rounded-2xl border-2 bg-zinc-900" />
  } else {
    return <div className="aspect-7/5 w-full rounded-2xl border-2 bg-zinc-900 animate-pulse" />
  }
}

function checkInternalURL(text: string): boolean {
  for (const match of text.matchAll(urlMatchRegex)) {
    if (safeParseURL(match[0])?.hostname.endsWith('litomi.cc')) {
      return true
    }
  }

  return false
}

function parsePostIdPathname(pathname: string) {
  const match = /^\/post\/(\d+)$/.exec(pathname)
  return match ? Number(match[1]) : null
}

function renderTextWithLinks(text: string) {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let matchCount = 0

  for (const match of text.matchAll(urlMatchRegex)) {
    const index = match.index ?? 0
    const raw = match[0]

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index))
    }

    const { url, trailing } = splitTrailingPunctuation(raw)
    nodes.push(renderURL(url, `url-${index}-${matchCount}`))

    if (trailing) {
      nodes.push(trailing)
    }

    lastIndex = index + raw.length
    matchCount += 1
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function renderURL(url: string, key: string) {
  const parsedURL = safeParseURL(url)

  if (!parsedURL) {
    return url
  }

  if (parsedURL.hostname.endsWith('litomi.cc')) {
    const postId = parsePostIdPathname(parsedURL.pathname)
    const href = postId ? getPostDetailHref(postId) : parsedURL

    return (
      <Link
        className="text-sky-400 underline underline-offset-2 hover:text-sky-300 transition"
        href={href}
        key={key}
        prefetch={false}
        title={url}
      >
        {parsedURL.pathname}
        {decodeURIComponent(parsedURL.search)}
      </Link>
    )
  }

  return url
}

function ReplyMarker({ label }: { label: string }) {
  return (
    <>
      <span className="sr-only">{label}: </span>
      <svg
        aria-hidden
        className="mr-1 inline-block size-[0.82em] align-[-0.04em] text-zinc-600"
        fill="none"
        viewBox="0 0 12 12"
      >
        <path d="M3.5 2.5v4.25A2.25 2.25 0 0 0 5.75 9H10" stroke="currentColor" strokeLinecap="round" />
      </svg>
    </>
  )
}

function safeParseURL(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function splitTrailingPunctuation(raw: string) {
  let url = raw
  let trailing = ''

  while (url.length > 0 && trailingPunctuationRegex.test(url[url.length - 1]!)) {
    trailing = url[url.length - 1]! + trailing
    url = url.slice(0, -1)
  }

  return { url, trailing }
}
