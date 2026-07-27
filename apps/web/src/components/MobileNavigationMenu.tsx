'use client'

import { Dialog } from '@litomi/ui'
import {
  Bookmark,
  Bot,
  Clover,
  FileText,
  Flame,
  HeartHandshake,
  History,
  PiggyBank,
  ScanEye,
  Settings,
  Star,
  Tag,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ReactNode, useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '@/app/[locale]/(navigation)/(ranking)/common'
import { Link, usePathname } from '@/i18n/navigation'

import LinkPending from './LinkPending'

type MobileMenuLinkProps = {
  href: string
  hrefMatch?: string
  icon: ReactNode
  title: string
  selectedIconStyle?: SelectedIconStyle
  pathname: string
  className?: string
  onClose: () => void
}

type Props = {
  open: boolean
  onClose: () => void
}

type SelectedIconStyle = 'fill-soft' | 'fill' | 'stroke'

export default function MobileNavigationMenu({ open, onClose }: Props) {
  const pathname = usePathname()
  const openedPathnameRef = useRef(pathname)
  const t = useTranslations('Navigation.mobileMenu')

  // NOTE: 페이지 이동 시 자동으로 닫힘
  useEffect(() => {
    if (!open) {
      openedPathnameRef.current = pathname
      return
    }

    if (pathname !== openedPathnameRef.current) {
      onClose()
    }
  }, [onClose, open, pathname])

  return (
    <Dialog
      ariaLabel={t('menuLabel')}
      className={twMerge(
        'h-auto max-h-[85dvh] scale-100 translate-y-full self-end rounded-t-3xl',
        'data-[state=open]:translate-y-0 max-sm:pt-0',
      )}
      onClose={onClose}
      open={open}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-5 pt-4 pb-1">
        <h2 className="text-lg font-bold">{t('menu')}</h2>
        <button
          aria-label={t('close')}
          className="-m-2 rounded-full p-2 transition hover:bg-zinc-800"
          onClick={onClose}
          type="button"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav
        aria-label={t('navLabel')}
        className="grid min-h-0 grid-cols-2 gap-1 overflow-y-auto p-3 pb-[calc(0.75rem+var(--safe-area-bottom))]"
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
          href="/tag/female"
          hrefMatch="/tag"
          icon={<Tag />}
          onClose={onClose}
          pathname={pathname}
          selectedIconStyle="fill-soft"
          title={t('tag')}
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
        <MobileMenuLink href="/censor" icon={<ScanEye />} onClose={onClose} pathname={pathname} title={t('censor')} />
        <MobileMenuLink
          href="/donation"
          icon={<HeartHandshake />}
          onClose={onClose}
          pathname={pathname}
          title={t('donation')}
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
          href="/fortune"
          hrefMatch="/fortune"
          icon={<Clover />}
          onClose={onClose}
          pathname={pathname}
          title={t('fortune')}
        />
        <MobileMenuLink
          className="col-span-2"
          href="/settings"
          icon={<Settings />}
          onClose={onClose}
          pathname={pathname}
          selectedIconStyle="fill-soft"
          title={t('settings')}
        />
      </nav>
    </Dialog>
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
  className,
  onClose,
}: MobileMenuLinkProps) {
  const isSelected = hrefMatch ? pathname.includes(hrefMatch) : pathname === href
  const isSamePath = pathname === href
  const selectedIconClassName = isSelected ? getSelectedIconClassName(selectedIconStyle) : ''
  const iconClassName = 'size-5 shrink-0 text-zinc-400 group-aria-[current=page]:text-foreground'

  return (
    <Link
      aria-current={isSelected ? 'page' : undefined}
      className={twMerge(
        'group flex min-h-14 items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:bg-zinc-800/50',
        'aria-[current=page]:bg-zinc-800 aria-[current=page]:border-zinc-700',
        className,
      )}
      href={href}
      onClick={() => isSamePath && onClose()}
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
      <span className="min-w-0 text-sm font-semibold leading-tight">{title}</span>
    </Link>
  )
}
