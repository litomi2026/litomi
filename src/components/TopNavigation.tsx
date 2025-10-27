'use client'

import type { ReactNode } from 'react'

import { Menu } from 'lucide-react'
import Link from 'next/link'

import IconLogo from './icons/IconLogo'

type Props = {
  children?: ReactNode
  className?: string
  onMenuClick?: () => void
}

export default function TopNavigation({ children, className, onMenuClick }: Readonly<Props>) {
  return (
    <nav className={className} role="navigation">
      <div className="flex items-center justify-between gap-2 px-2 sm:hidden">
        <button
          aria-label="메뉴 열기"
          className="relative hover:bg-zinc-800 rounded-lg transition"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="size-9 p-2" />
        </button>
        <Link className="group p-2 focus:outline-none sm:hidden" href="/">
          <IconLogo className="size-6" priority />
        </Link>
        <div className="w-12" />
      </div>
      {children}
    </nav>
  )
}
