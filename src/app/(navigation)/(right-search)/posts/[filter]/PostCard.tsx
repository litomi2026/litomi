import type { ReactNode } from 'react'

import dayjs from 'dayjs'
import Link from 'next/link'

import PostMangaCard from '@/app/(navigation)/(right-search)/post/[id]/@post/PostMangaCard'
import { type Post } from '@/components/post/XPostCard'
import Squircle from '@/components/ui/Squircle'
import { formatDistanceToNow } from '@/utils/format/date'

const urlMatchRegex = /https?:\/\/[^\s]+/g
const trailingPunctuationRegex = /[.,!?;:)\]}]/

export default function PostCard({ post }: { post: Post }) {
  const author = post.author
  const authorNickname = author?.nickname
  const content = post.content ?? ''
  const hasInternalURL = checkInternalURL(content)

  return (
    <article className="w-full overflow-hidden rounded-2xl border-2 bg-zinc-900 transition hover:bg-zinc-800/70 hover:border-zinc-700/70">
      {post.mangaId && (
        <div className="border-b-2 border-zinc-800">
          <Link className="block" href={`/manga/${post.mangaId}`} prefetch={false}>
            <PostMangaCard mangaId={post.mangaId} variant="cover" />
          </Link>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        {hasInternalURL ? (
          <div className="p-3">
            <p className="min-w-0 whitespace-pre-wrap break-all text-sm leading-relaxed line-clamp-4 text-zinc-100">
              {renderTextWithLinks(content)}
            </p>
            <Link
              className="mt-2 inline-block text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
              href={`/post/${post.id}`}
              prefetch={false}
            >
              자세히 보기
            </Link>
          </div>
        ) : (
          <Link className="block p-3" href={`/post/${post.id}`} prefetch={false}>
            <p className="min-w-0 whitespace-pre-wrap break-all text-sm leading-relaxed line-clamp-4 text-zinc-100">
              {content || <span className="text-zinc-400">삭제된 글이에요</span>}
            </p>
          </Link>
        )}

        <Link
          className="flex min-w-0 items-center gap-1 text-xs text-zinc-400 p-3 pt-0"
          href={`/@${author?.name}`}
          prefetch={false}
        >
          <Squircle className="w-6 shrink-0" src={author?.imageURL} textClassName="text-[10px] text-foreground">
            {(authorNickname ?? '탈퇴').slice(0, 2)}
          </Squircle>
          <div className="min-w-0 flex-1 truncate ml-1" title={authorNickname}>
            {authorNickname ?? <span className="text-zinc-400">탈퇴한 사용자예요</span>}
          </div>
          <div
            className="text-xs text-zinc-400 shrink-0 overflow-hidden"
            title={dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
          >
            {formatDistanceToNow(new Date(post.createdAt))}
          </div>
        </Link>
      </div>
    </article>
  )
}

export function PostSkeleton() {
  return <div className="aspect-5/7 w-full rounded-2xl border-2 bg-zinc-900" />
}

function checkInternalURL(text: string): boolean {
  for (const match of text.matchAll(urlMatchRegex)) {
    const parsedURL = safeParseURL(match[0])
    if (parsedURL?.hostname.endsWith('litomi.in')) {
      return true
    }
  }

  return false
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

  if (parsedURL.hostname.endsWith('litomi.in')) {
    return (
      <Link
        className="text-sky-400 underline underline-offset-2 hover:text-sky-300 transition"
        href={parsedURL}
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
