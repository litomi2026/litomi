'use client'

import { Bookmark, FileText, History, PiggyBank, Settings, Star, Tag, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'

import useMeQuery from '@/query/useMeQuery'

import LinkPending from './LinkPending'

type MobileMenuLinkProps = {
  href: string
  hrefMatch?: string
  icon: ReactNode
  title: string
  selectedIconStyle?: SelectedIconStyle
  pathname: string
  onClose: () => void
}

type Props = {
  onClose: () => void
}

type SelectedIconStyle = 'fill-soft' | 'fill' | 'stroke'

export default function MobileNavigationMenu({ onClose }: Readonly<Props>) {
  const pathname = usePathname()
  const { data: me } = useMeQuery()
  const username = me?.name ?? ''
  const initialPathnameRef = useRef(pathname)

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

  // NOTE: 페이지 이동 시 자동으로 닫힘
  useEffect(() => {
    if (pathname !== initialPathnameRef.current) {
      onClose()
    }
  }, [onClose, pathname])

  return (
    <>
      <div className="fixed inset-0 z-60 bg-background/50 animate-fade-in-fast" onClick={onClose} />
      <nav
        className="fixed top-0 left-0 z-60 h-full w-3xs bg-background border-r-2 shadow-xl pt-safe animate-fade-in-fast overflow-y-auto"
        role="navigation"
      >
        <div className="sticky top-0 bg-background flex items-center justify-between p-4 pl-[max(1rem,var(--safe-area-left))] border-b-2 border-zinc-800">
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
        <div className="flex flex-col gap-1 p-3 pl-[max(0.75rem,var(--safe-area-left))] pb-safe">
          <MobileMenuLink
            href="/posts/recommand"
            hrefMatch="/post"
            icon={<FileText />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill-soft"
            title="이야기"
          />
          <MobileMenuLink
            href="/library/history"
            icon={<History />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill-soft"
            title="감상 기록"
          />
          <MobileMenuLink
            href="/library/bookmark"
            icon={<Bookmark />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill"
            title="북마크"
          />
          <MobileMenuLink
            href="/library/rating"
            icon={<Star />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill"
            title="평가"
          />
          <MobileMenuLink
            href="/tag"
            hrefMatch="/tag"
            icon={<Tag />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill-soft"
            title="태그"
          />
          <MobileMenuLink
            href="/libo"
            hrefMatch="/libo"
            icon={<PiggyBank />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill-soft"
            title="리보"
          />
          <MobileMenuLink
            href={`/@${username}/settings`}
            icon={<Settings />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill-soft"
            title="설정"
          />
        </div>
      </nav>
    </>
  )
}

function getSelectedIconClassName(selectedIconStyle: SelectedIconStyle) {
  switch (selectedIconStyle) {
    case 'fill':
      return '[&_svg]:fill-current'
    case 'fill-soft':
      return '[&_svg]:fill-current [&_svg]:[fill-opacity:0.3]'
    case 'stroke':
      return '[&_svg]:stroke-3'
    default:
      return ''
  }
}

function MobileMenuLink({
  href,
  hrefMatch,
  icon,
  title,
  selectedIconStyle = 'stroke',
  pathname,
  onClose,
}: MobileMenuLinkProps) {
  const isSelected = hrefMatch ? pathname.includes(hrefMatch) : pathname === href
  const isSamePath = pathname === href
  const selectedIconClassName = isSelected ? getSelectedIconClassName(selectedIconStyle) : ''
  const iconClassName = 'size-4 shrink-0 text-zinc-400 aria-current:text-foreground'

  return (
    <Link
      aria-current={isSelected ? 'page' : undefined}
      className="flex items-center gap-4 p-3 rounded-lg transition hover:bg-zinc-800/50 border border-transparent
        aria-[current=page]:bg-zinc-800 aria-[current=page]:border-zinc-700"
      href={href}
      onClick={() => isSamePath && onClose()}
      prefetch={false}
    >
      <LinkPending className={iconClassName}>
        <span
          aria-hidden
          className={twMerge(
            'inline-flex items-center justify-center',
            iconClassName,
            '[&_svg]:size-full [&_svg]:shrink-0',
            selectedIconClassName,
          )}
        >
          {icon}
        </span>
      </LinkPending>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base leading-tight">{title}</h3>
      </div>
    </Link>
  )
}
