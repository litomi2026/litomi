'use client'

import { Bookmark, History, Settings, Star, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import useMeQuery from '@/query/useMeQuery'

import IconPost from './icons/IconPost'
import IconTag from './icons/IconTag'
import LinkPending from './LinkPending'

type MenuLinkProps = {
  href: string
  icon: React.ReactNode
  title: string
  description?: string
  isActive: boolean
}

type Props = {
  onClose: () => void
}

export default function MobileNavigationMenu({ onClose }: Readonly<Props>) {
  const pathname = usePathname()
  const { data: me } = useMeQuery()
  const username = me?.name ?? ''

  // NOTE: 메뉴가 열릴 때 body 스크롤을 방지함
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-60 bg-background/50 animate-fade-in-fast" onClick={onClose} />
      <nav
        className="fixed top-0 left-0 z-60 h-full w-3xs bg-background border-r-2 shadow-xl animate-fade-in-fast overflow-y-auto"
        role="navigation"
      >
        <div className="sticky top-0 bg-background flex items-center justify-between p-4 border-b-2 border-zinc-800">
          <h2 className="text-lg font-bold">메뉴</h2>
          <button
            aria-label="메뉴 닫기"
            className="p-2 -m-2 hover:bg-zinc-800 rounded-lg transition"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex flex-col gap-1 p-3 pb-safe">
          <MenuLink
            href="/posts/recommand"
            icon={<IconPost className="w-5" selected={pathname.includes('/post')} />}
            isActive={pathname.includes('/post')}
            title="이야기"
          />
          <MenuLink
            href="/library/history"
            icon={
              <History
                aria-current={pathname.includes('/library/history') ? 'page' : undefined}
                className="size-5 aria-current:fill-foreground"
              />
            }
            isActive={pathname === '/library/history'}
            title="감상 기록"
          />
          <MenuLink
            href="/library/bookmark"
            icon={
              <Bookmark
                aria-current={pathname.includes('/library/bookmark') ? 'page' : undefined}
                className="size-5 aria-current:fill-foreground"
              />
            }
            isActive={pathname === '/library/bookmark'}
            title="북마크"
          />
          <MenuLink
            href="/library/rating"
            icon={
              <Star
                aria-current={pathname.includes('/library/rating') ? 'page' : undefined}
                className="size-5 aria-current:fill-foreground"
              />
            }
            isActive={pathname === '/library/rating'}
            title="평가"
          />
          <MenuLink
            href="/tag"
            icon={<IconTag className="w-5" selected={pathname.includes('/tag')} />}
            isActive={pathname.includes('/tag')}
            title="태그"
          />
          <MenuLink
            href={`/@${username}/settings`}
            icon={
              <Settings
                aria-current={pathname.includes(`/@${username}/settings`) ? 'page' : undefined}
                className="size-5 aria-current:fill-foreground"
              />
            }
            isActive={pathname === `/@${username}/settings`}
            title="설정"
          />
        </div>
      </nav>
    </>
  )
}

function MenuLink({ href, icon, title, description, isActive }: MenuLinkProps) {
  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className="flex items-center gap-4 p-3 rounded-lg transition hover:bg-zinc-800/50 border border-transparent
        aria-[current=page]:bg-zinc-800 aria-[current=page]:border-zinc-700"
      href={href}
    >
      <div className="shrink-0">
        <LinkPending className="size-5">{icon}</LinkPending>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base leading-tight">{title}</h3>
        {description && <p className="text-sm text-zinc-400 leading-tight mt-0.5">{description}</p>}
      </div>
    </Link>
  )
}
