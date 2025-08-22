'use client'

import { LibraryBig, Lock } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'

import { formatNumber } from '@/utils/format'

type LibraryHomeLinkProps = {
  isGuest: boolean
  libraryCount: number
  mangaCount: number
  onClick?: () => void
}

type Props = {
  library: {
    id: number
    name: string
    isPublic: boolean
    itemCount: number
    color?: string | null
    icon?: string | null
  }
  onClick?: () => void
}

export function LibraryHomeLink({ isGuest, libraryCount, mangaCount, onClick }: Readonly<LibraryHomeLinkProps>) {
  const pathname = usePathname()

  return (
    <Link
      aria-current={pathname === '/library'}
      className="flex items-center gap-3 p-2 rounded-lg border border-transparent transition hover:bg-zinc-800/50 text-zinc-400 hover:text-white
      aria-current:bg-zinc-800 aria-current:text-white aria-current:border-zinc-700"
      href="/library"
      onClick={onClick}
    >
      <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
        <LibraryBig className="w-4 h-4 text-white" />
      </div>
      <div className="sm:hidden lg:block">
        <p className="flex-1 font-medium">{isGuest ? '공개 서재 둘러보기' : '모든 서재'}</p>
        <p className="text-xs text-zinc-500 break-words">
          {libraryCount}개 서재 · {mangaCount}개 만화
        </p>
      </div>
    </Link>
  )
}

export default function LibraryLink({ library, onClick }: Readonly<Props>) {
  const params = useParams()
  const currentLibraryId = params.id
  const isActive = currentLibraryId === library.id.toString()

  return (
    <Link
      aria-current={isActive}
      className="flex items-center gap-3 p-2 rounded-lg transition aria-current:bg-zinc-800 aria-current:border aria-current:border-zinc-700 hover:bg-zinc-800/50 border border-transparent"
      href={`/library/${library.id}`}
      onClick={onClick}
    >
      <div
        aria-current={isActive}
        className="size-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-700 aria-current:shadow-md"
        style={{ backgroundColor: library.color ?? '' }}
      >
        <span className="text-sm">{library.icon || '📚'}</span>
      </div>
      <div className="flex-1 sm:hidden lg:block">
        <div className="flex items-center justify-between gap-1.5">
          <h3
            aria-current={isActive}
            className="font-medium line-clamp-1 break-all aria-current:text-foreground text-zinc-500"
          >
            {library.name}
          </h3>
          {!library.isPublic && <Lock aria-label="비공개 서재" className="size-3 text-zinc-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-zinc-500">{formatNumber(library.itemCount)}개</p>
      </div>
      {isActive && <div className="w-1 h-8 bg-brand-end rounded-full hidden lg:block" />}
    </Link>
  )
}
