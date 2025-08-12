import type { ReactNode } from 'react'

import Link from 'next/link'

import IconLogo from './icons/IconLogo'
import IconMenu from './icons/IconMenu'

type Props = {
  children?: ReactNode
  className?: string
}

export default function TopNavigation({ children, className }: Readonly<Props>) {
  return (
    <nav className={className} role="navigation">
      <div className="flex items-center justify-between gap-2 px-2 sm:hidden">
        <IconMenu className="relative h-10 w-10 cursor-pointer p-2" />
        <Link className="group p-2 focus:outline-none sm:hidden" href="/">
          <IconLogo className="size-6" priority />
        </Link>
        <div className="w-12" />
      </div>
      {children}
    </nav>
  )
}
