import type { LibraryWithCount } from '@/app/api/library/route'

import CreateLibraryButton from './CreateLibraryButton'
import LibraryLink, { LibraryHomeLink } from './LibraryLink'

type Props = {
  libraries: LibraryWithCount[]
  username: string | null
  isMobile?: boolean
  onClick?: () => void
}

export default function LibrarySidebar({ libraries, username, isMobile = false, onClick }: Readonly<Props>) {
  const isGuest = !username
  const mangaCount = libraries.reduce((sum, lib) => sum + lib.itemCount, 0)

  return (
    <aside
      className={`${isMobile ? 'h-full' : 'hidden sm:flex sm:flex-col max-w-56'} border-r sticky top-0`}
      onClick={onClick}
    >
      <div className="grid gap-2 p-2 lg:p-3 lg:gap-3">
        <div className="flex items-center justify-center lg:justify-between">
          <h2 className="text-sm font-medium text-zinc-400 hidden lg:block">{isGuest ? '공개 서재' : '서재'}</h2>
          {!isGuest && <CreateLibraryButton isMobile={isMobile} />}
        </div>
        <LibraryHomeLink isGuest={isGuest} libraryCount={libraries.length} mangaCount={mangaCount} />
        {libraries.length > 0 && <div className="h-px bg-zinc-800 my-1" />}
        {libraries.map((library) => (
          <LibraryLink key={library.id} library={library} />
        ))}
      </div>
    </aside>
  )
}
