import { Bookmark, Clock, LibraryBig, Lock } from 'lucide-react'

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
  userId: string | null
  className?: string
  onClick?: () => void
}

export default function LibrarySidebar({ libraries, userId, className = '', onClick }: Readonly<Props>) {
  const isGuest = !userId
  const mangaCount = libraries.reduce((sum, lib) => sum + lib.itemCount, 0)

  return (
    <aside className={`border-r ${className}`}>
      <div className="grid gap-2 p-2 lg:p-3 lg:gap-3">
        <div className="flex items-center justify-center lg:justify-between">
          <h2 className="text-sm font-medium text-zinc-400 hidden lg:block">{isGuest ? '공개 서재' : '서재'}</h2>
          <CreateLibraryButton />
        </div>
        <LibrarySidebarLink
          description={`${libraries.length}개 서재 · ${mangaCount}개 작품`}
          href="/library"
          icon={<LibraryBig className="size-4 text-background" />}
          iconBackground="linear-gradient(to bottom right, var(--color-brand-start), var(--color-brand-end))"
          onClick={onClick}
          title={isGuest ? '모든 공개 서재' : '모든 서재'}
        />
        <div className="h-px bg-zinc-800 my-1" />
        <LibrarySidebarLink
          description="최근 읽은 작품"
          href="/library/history"
          icon={<Clock className="size-4 text-background" />}
          iconBackground="var(--color-brand-end)"
          onClick={onClick}
          title="감상 기록"
        />
        <LibrarySidebarLink
          description="즐겨찾기한 작품"
          href="/library/bookmark"
          icon={<Bookmark className="size-4 text-background" />}
          iconBackground="var(--color-brand-end)"
          onClick={onClick}
          title="북마크"
        />
        {libraries.length > 0 && <div className="h-px bg-zinc-800 my-1" />}
        {libraries.map((library) => (
          <LibrarySidebarLink
            badge={!library.isPublic && <Lock className="size-3 text-zinc-500 flex-shrink-0" />}
            description={`${formatNumber(library.itemCount)}개`}
            href={`/library/${library.id}`}
            icon={<span className="text-sm">{library.icon || '📚'}</span>}
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
