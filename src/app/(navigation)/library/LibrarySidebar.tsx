import { Bookmark, Clock, Globe, LibraryBig, Lock, Star } from 'lucide-react'

import { formatNumber } from '@/utils/format'

import CreateLibraryButton from './CreateLibraryButton'
import LibrarySidebarLink from './LibrarySidebarLink'

type Props = {
  libraries: {
    id: number
    name: string
    description: string | null
    color: string | null
    icon: string | null
    userId: number
    isPublic: boolean
    itemCount: number
  }[]
  userId: number | null
  className?: string
  onClick?: () => void
  bookmarkCount?: number
  historyCount?: number
  ratingCount?: number
}

export default function LibrarySidebar({
  libraries,
  userId,
  className = '',
  onClick,
  bookmarkCount,
  historyCount,
  ratingCount,
}: Props) {
  const mangaCount = libraries.reduce((sum, lib) => sum + lib.itemCount, 0)

  const info = userId
    ? {
        headerTitle: '서재',
        title: '모든 서재',
        description: `${libraries.length}개 서재 · ${formatNumber(mangaCount, 'ko')}개`,
      }
    : {
        headerTitle: '공개 서재',
        title: '모든 공개 서재',
        description: `${formatNumber(mangaCount, 'ko')}개`,
      }

  return (
    <aside className={`border-r ${className}`}>
      <div className="grid gap-2 p-2 lg:p-3 lg:gap-3">
        <div className="flex items-center justify-center lg:justify-between">
          <h2 className="text-sm font-medium text-zinc-400 hidden lg:block">{info.headerTitle}</h2>
          <CreateLibraryButton />
        </div>
        <LibrarySidebarLink
          description={info.description}
          href="/library"
          icon={<LibraryBig className="size-4 text-background" />}
          iconBackground="linear-gradient(to bottom right, var(--color-brand-start), var(--color-brand-end))"
          onClick={onClick}
          title={info.title}
        />
        <div className="h-px bg-zinc-800 my-1" />
        <LibrarySidebarLink
          description={historyCount !== undefined ? `${formatNumber(historyCount, 'ko')}개 작품` : '최근 읽은 작품'}
          href="/library/history"
          icon={<Clock className="size-4 text-background" />}
          iconBackground="var(--color-brand-end)"
          onClick={onClick}
          title="감상 기록"
        />
        <LibrarySidebarLink
          description={bookmarkCount !== undefined ? `${formatNumber(bookmarkCount, 'ko')}개 작품` : '즐겨찾기한 작품'}
          href="/library/bookmark"
          icon={<Bookmark className="size-4 text-background" />}
          iconBackground="var(--color-brand-end)"
          onClick={onClick}
          title="북마크"
        />
        <LibrarySidebarLink
          description={ratingCount !== undefined ? `${formatNumber(ratingCount, 'ko')}개 작품` : '평가한 작품'}
          href="/library/rating"
          icon={<Star className="size-4 text-background" />}
          iconBackground="var(--color-brand-end)"
          onClick={onClick}
          title="평가"
        />
        {libraries.length > 0 && <div className="h-px bg-zinc-800 my-1" />}
        {libraries.map((library) => (
          <LibrarySidebarLink
            badge={
              !library.isPublic ? (
                <Lock className="size-3 text-zinc-500 shrink-0" />
              ) : library.userId !== userId ? (
                <Globe className="size-3 text-zinc-500 shrink-0" />
              ) : null
            }
            description={`${formatNumber(library.itemCount)}개`}
            href={`/library/${library.id}`}
            icon={
              <>
                <span className="text-sm sm:hidden lg:inline">{library.icon || '📚'}</span>
                <span className="text-sm hidden sm:inline lg:hidden text-foreground font-semibold">
                  {library.name.slice(0, 1)}
                </span>
              </>
            }
            iconBackground={library.color || 'rgb(113 113 122)'}
            key={library.id}
            onClick={onClick}
            showActiveIndicator
            title={library.name}
          />
        ))}
      </div>
    </aside>
  )
}
