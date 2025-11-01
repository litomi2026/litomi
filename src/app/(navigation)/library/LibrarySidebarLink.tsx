'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { ReactNode } from 'react'

import LinkPending from '@/components/LinkPending'

type LibrarySidebarLinkProps = {
  href: string
  icon: ReactNode
  iconBackground?: string
  title: string
  description?: string
  onClick?: () => void
  badge?: ReactNode
  showActiveIndicator?: boolean
}

export default function LibrarySidebarLink({
  href,
  icon,
  iconBackground,
  title,
  description,
  onClick,
  badge,
  showActiveIndicator,
}: LibrarySidebarLinkProps) {
  const pathname = usePathname()
  const params = useParams()
  const libraryIdMatch = href.match(/^\/library\/(\d+)$/)
  const isActive = libraryIdMatch ? params.id === libraryIdMatch[1] : pathname === href

  return (
    <Link
      aria-current={isActive}
      className="flex text-sm items-center gap-3 p-2 lg:px-3 rounded-lg border border-transparent transition hover:bg-zinc-800/50 text-zinc-400 hover:text-white
      aria-current:bg-zinc-800 aria-current:text-white aria-current:border-zinc-700"
      href={href}
      onClick={onClick}
      title={title}
    >
      <div
        aria-current={isActive}
        className="size-8 rounded-lg flex items-center justify-center shrink-0 aria-current:shadow-md"
        style={iconBackground ? { background: iconBackground } : undefined}
      >
        <LinkPending className="size-4 text-background">{icon}</LinkPending>
      </div>
      <div className="flex-1 sm:hidden lg:block">
        <div className="flex items-center justify-between gap-1.5">
          <h3
            aria-current={isActive}
            className="font-medium line-clamp-1 break-all aria-current:text-foreground text-zinc-500"
          >
            {title}
          </h3>
          {badge}
        </div>
        {description && <p className="text-xs text-zinc-500 wrap-break-word">{description}</p>}
      </div>
      {showActiveIndicator && isActive && <div className="w-1 h-8 bg-brand-end rounded-full hidden lg:block" />}
    </Link>
  )
}
