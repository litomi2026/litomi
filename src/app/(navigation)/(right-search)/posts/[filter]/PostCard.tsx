import Link from 'next/link'

import PostMangaCard from '@/app/(navigation)/(right-search)/post/[id]/@post/PostMangaCard'
import { type Post } from '@/components/post/XPostCard'
import Squircle from '@/components/ui/Squircle'

export default function PostCard({ post }: { post: Post }) {
  const author = post.author
  const authorNickname = author?.nickname

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
        <Link className="block p-3" href={`/post/${post.id}`} prefetch={false}>
          <p className="min-w-0 whitespace-pre-wrap break-all text-sm leading-relaxed line-clamp-4 text-zinc-100">
            {post.content || <span className="text-zinc-400">삭제된 글이에요</span>}
          </p>
        </Link>

        <Link
          className="flex min-w-0 items-center gap-2 text-xs text-zinc-400 p-3 pt-0"
          href={`/@${author?.name}`}
          prefetch={false}
        >
          <Squircle className="w-6 shrink-0" src={author?.imageURL} textClassName="text-[10px] text-foreground">
            {(authorNickname ?? '탈퇴').slice(0, 2)}
          </Squircle>
          <div className="min-w-0 flex-1 truncate" title={authorNickname}>
            {authorNickname ?? <span className="text-zinc-400">탈퇴한 사용자예요</span>}
          </div>
        </Link>
      </div>
    </article>
  )
}

export function PostSkeleton() {
  return <div className="aspect-5/7 w-full rounded-2xl border-2 bg-zinc-900" />
}
