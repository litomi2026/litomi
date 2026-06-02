'use client'

import {
  Bookmark,
  Bot,
  Clover,
  FileText,
  Flame,
  HeartHandshake,
  History,
  PiggyBank,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '@/app/[locale]/(navigation)/(ranking)/common'
import OverlayHost from '@/components/ui/OverlayHost'
import { Link, usePathname } from '@/i18n/navigation'

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

export default function MobileNavigationMenu({ onClose }: Props) {
  const pathname = usePathname()
  const initialPathnameRef = useRef(pathname)
  const t = useTranslations('Navigation.mobileMenu')

  // NOTE: 메뉴가 열릴 때 body 스크롤을 방지함
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousBodyOverflow
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
    <OverlayHost>
      <div className="pointer-events-auto fixed inset-0 animate-fade-in-fast">
        <button aria-label={t('close')} className="absolute inset-0 bg-background/50" onClick={onClose} type="button" />
      </div>
      <aside
        aria-label={t('menuLabel')}
        className="pointer-events-auto fixed inset-y-0 left-0 flex max-w-3xs w-full flex-col border-r-2 bg-background shadow animate-fade-in-fast"
      >
        <div className="flex items-center justify-between border-b-2 border-zinc-800 p-4 pl-[calc(1rem+var(--safe-area-left))] pt-[calc(1rem+var(--safe-area-top))]">
          <h2 className="text-lg font-bold pl-4">{t('menu')}</h2>
          <button
            aria-label={t('close')}
            className="p-2 -m-2 hover:bg-zinc-800 rounded-lg transition"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav
          aria-label={t('navLabel')}
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3 pl-[calc(0.75rem+var(--safe-area-left))] pb-[calc(0.75rem+var(--safe-area-bottom))]"
        >
          <MobileMenuLink
            href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`}
            icon={<Flame />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill"
            title={t('ranking')}
          />
          <MobileMenuLink
            href="/library/bookmark"
            icon={<Bookmark />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill"
            title={t('bookmark')}
          />
          <MobileMenuLink
            href="/posts/recommend"
            hrefMatch="/post"
            icon={<FileText />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill-soft"
            title={t('posts')}
          />
          <MobileMenuLink
            href="/tag"
            hrefMatch="/tag"
            icon={<Tag />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill-soft"
            title={t('tag')}
          />
          <MobileMenuLink
            href="/chat"
            icon={<Bot />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="stroke"
            title={t('chat')}
          />
          <MobileMenuLink
            href="/libo"
            hrefMatch="/libo"
            icon={<PiggyBank />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill-soft"
            title={t('libo')}
          />
          <MobileMenuLink
            href="/library/history"
            icon={<History />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill-soft"
            title={t('history')}
          />
          <MobileMenuLink
            href="/library/rating"
            icon={<Star />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill"
            title={t('rating')}
          />
          <MobileMenuLink
            href="/fortune"
            hrefMatch="/fortune"
            icon={<Clover />}
            onClose={onClose}
            pathname={pathname}
            title={t('fortune')}
          />
          <MobileMenuLink
            href="/settings"
            icon={<Settings />}
            onClose={onClose}
            pathname={pathname}
            selectedIconStyle="fill-soft"
            title={t('settings')}
          />
          <div className="mt-auto grid gap-1 border-t border-zinc-800/80 pt-3">
            <MobileMenuLink
              href="/censor"
              icon={<ShieldCheck />}
              onClose={onClose}
              pathname={pathname}
              title={t('censor')}
            />
            <MobileMenuLink
              href="/donations"
              icon={<HeartHandshake />}
              onClose={onClose}
              pathname={pathname}
              title={t('donations')}
            />
          </div>
        </nav>
      </aside>
    </OverlayHost>
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
      className={twMerge(
        'flex items-center gap-4 p-3 rounded-lg transition hover:bg-zinc-800/50 border border-transparent',
        'aria-[current=page]:bg-zinc-800 aria-[current=page]:border-zinc-700',
      )}
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
