'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentProps, ReactNode } from 'react'

import LinkPending from '@/components/LinkPending'

type Props = ComponentProps<typeof Link> & {
  className?: string
  Icon: (props: { className: string; selected: boolean }) => ReactNode
  hrefMatch?: string
}

export default function SelectableLink({ className = '', Icon, children, href, hrefMatch, ...props }: Props) {
  const pathname = usePathname()
  const isSelected = hrefMatch ? pathname.includes(hrefMatch) : pathname === href.toString()

  return (
    <Link
      {...props}
      aria-current={pathname === href.toString() ? 'page' : undefined}
      aria-selected={isSelected}
      className={`callout-none group flex p-1 aria-selected:font-bold aria-[current=page]:pointer-events-none sm:block sm:p-0 ${className}`}
      href={href}
    >
      <div
        className="flex items-center gap-5 w-fit mx-auto p-3 rounded-full transition 2xl:m-0 relative
        group-hover:bg-zinc-800 group-active:scale-90 group-active:md:scale-95"
      >
        <LinkPending className="w-6">
          <Icon className="w-6" selected={isSelected} />
        </LinkPending>
        <span className="hidden min-w-0 2xl:block">{children}</span>
      </div>
    </Link>
  )
}
