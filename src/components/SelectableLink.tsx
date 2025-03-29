'use client'

import type { ComponentProps, ReactNode } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = ComponentProps<typeof Link> & {
  className?: string
  iconClassName?: string
  Icon: (props: { className: string; selected: boolean }) => ReactNode
}

export default function SelectableLink({ className, iconClassName, Icon, children, href, onClick }: Props) {
  const pathname = usePathname()
  const isSelected = pathname.includes(href.toString())

  return (
    <Link
      aria-selected={isSelected}
      className={`callout-none group flex p-1 aria-selected:font-bold aria-selected:pointer-events-none sm:block sm:p-0 ${className}`}
      href={href}
      onClick={onClick}
    >
      <div
        className="flex items-center gap-5 w-fit mx-auto p-3 rounded-full transition 2xl:m-0
        group-hover:bg-zinc-800 group-active:scale-90"
      >
        <Icon className={`w-6 transition-transform ${iconClassName}`} selected={isSelected} />
        <span className="hidden min-w-0 2xl:block">{children}</span>
      </div>
    </Link>
  )
}
