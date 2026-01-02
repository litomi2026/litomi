'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentProps, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

import LinkPending from '@/components/LinkPending'

type Props = ComponentProps<typeof Link> & {
  className?: string
  icon: ReactNode
  iconClassName?: string
  selectedIconStyle?: 'fill-soft' | 'fill' | 'stroke'
  hrefMatch?: string
}

export default function SelectableLink({
  className = '',
  icon,
  iconClassName = 'size-6 shrink-0',
  selectedIconStyle = 'stroke',
  children,
  href,
  hrefMatch,
  ...props
}: Props) {
  const pathname = usePathname()
  const isSelected = hrefMatch ? pathname.includes(hrefMatch) : pathname === href.toString()
  const selectedIconClassName = isSelected ? getSelectedIconClassName(selectedIconStyle) : ''

  return (
    <Link
      {...props}
      aria-current={pathname === href.toString() ? 'page' : undefined}
      aria-selected={isSelected}
      className={twMerge(
        'callout-none group flex p-1 aria-selected:font-bold aria-[current=page]:pointer-events-none sm:block sm:p-0',
        'text-zinc-400 hover:text-foreground aria-selected:text-foreground',
        className,
      )}
      href={href}
      prefetch={false}
    >
      <div
        className="flex items-center gap-5 w-fit mx-auto p-3 rounded-full transition 2xl:m-0 relative
        group-active:scale-90 group-active:md:scale-95"
      >
        <LinkPending className={iconClassName}>
          <span
            aria-hidden
            className={twMerge(iconClassName, '[&_svg]:size-full [&_svg]:shrink-0', selectedIconClassName)}
          >
            {icon}
          </span>
        </LinkPending>
        <span className="hidden min-w-0 2xl:block">{children}</span>
      </div>
    </Link>
  )
}

function getSelectedIconClassName(selectedIconStyle: 'fill-soft' | 'fill' | 'stroke') {
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
