import type { TPost, TReferedPost } from '@/mock/post'

import dayjs from 'dayjs'
import Link from 'next/link'

import Icon3Dots from '../icons/Icon3Dots'
import Squircle from '../ui/Squircle'
import PostImages from './PostImages'

type Props = {
  referredPost: TReferedPost
}

export default function ReferredPostCard({ referredPost }: Props) {
  const { createdAt, updatedAt, imageURLs, author, content, id } = referredPost

  return (
    <Link
      className={`grid min-w-0 cursor-pointer overflow-hidden rounded-2xl border-2 transition border-zinc-600 hover:bg-zinc-900`}
      href={`/post/${id}`}
    >
      <div className="grid gap-1 p-3">
        <div className="flex min-w-0 justify-between gap-1">
          <div className="flex min-w-0 gap-1 whitespace-nowrap">
            <Squircle className="w-6 flex-shrink-0" src={author?.profileImageURLs?.[0]} textClassName="text-white">
              {author?.nickname.slice(0, 2) ?? '탈퇴'}
            </Squircle>
            <div aria-disabled={!author} className="min-w-0 max-w-40 overflow-hidden font-semibold">
              {author?.nickname ?? '탈퇴한 사용자입니다'}
            </div>
            <div className="flex min-w-0 items-center gap-1 text-zinc-500">
              {author && (
                <>
                  <div className="min-w-10 max-w-40 overflow-hidden">@{author.name}</div>
                  <span>·</span>
                </>
              )}
              <div className="shrink-0 text-xs overflow-hidden">
                {dayjs(createdAt).format('YYYY-MM-DD HH:mm')}
                {updatedAt && <span> (수정됨)</span>}
              </div>
            </div>
          </div>
          <Icon3Dots className="w-5 text-zinc-600" />
        </div>
        {content && <p className="min-w-0 whitespace-pre-wrap break-all">{content}</p>}
      </div>
      {imageURLs && (
        <PostImages
          className="w-full max-h-[512px] overflow-hidden"
          initialPost={referredPost as unknown as TPost}
          urls={imageURLs}
        />
      )}
    </Link>
  )
}
