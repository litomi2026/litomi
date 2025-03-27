'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  className?: string
  iconClassName?: string
  href: string
  children: ReactNode
  Icon: (props: { className: string; selected: boolean }) => ReactNode
  onClick?: () => void
}

export default function NavigLink({
  className = '',
  iconClassName = '',
  href,
  children,
  Icon,
  onClick,
}: Props) {
  const pathname = usePathname()
  const isSelected = pathname.includes(href)

  return (
    <Link
      className={`callout-none group flex p-1 focus:outline-none sm:block sm:p-0 ${className}`}
      href={href}
      onClick={onClick}
    >
      <div className="group-hover:bg-midnight-500/20 group-hover:dark:bg-midnight-500/50 group-focus-visible:outline-midnight-500 group-focus:dark:outline-midnight-200 mx-auto flex w-fit items-center gap-5 rounded-full p-3 transition group-focus-visible:outline group-active:scale-90 xl:m-0">
        <Icon
          className={`w-6 transition-transform group-hover:scale-110 ${iconClassName}`}
          selected={isSelected}
        />
        <span
          aria-selected={isSelected}
          className="hidden min-w-0 aria-selected:font-bold xl:block"
        >
          {children}
        </span>
      </div>
    </Link>
  )
}
