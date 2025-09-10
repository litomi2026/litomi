'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentProps, memo, ReactNode } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'

type LoadableIconProps = {
  className: string
  Icon: (props: { className: string; selected: boolean }) => ReactNode
  selected: boolean
}

type Props = ComponentProps<typeof Link> & {
  className?: string
  Icon: (props: { className: string; selected: boolean }) => ReactNode
  hrefMatch?: string
}

export default memo(SelectableLink)

function LoadableIcon({ className, Icon, selected }: LoadableIconProps) {
  const { pending } = useLinkStatus()
  return pending ? <IconSpinner className={className} /> : <Icon className={className} selected={selected} />
}

function SelectableLink({ className = '', Icon, children, href, hrefMatch }: Props) {
  const pathname = usePathname()
  const isSelected = hrefMatch ? pathname.includes(hrefMatch) : pathname === href.toString()

  return (
    <Link
      aria-current={pathname === href.toString() ? 'page' : undefined}
      aria-selected={isSelected}
      className={`callout-none group flex p-1 aria-selected:font-bold aria-[current=page]:pointer-events-none sm:block sm:p-0 ${className}`}
      href={href}
    >
      <div
        className="flex items-center gap-5 w-fit mx-auto p-3 rounded-full transition 2xl:m-0 relative
        group-hover:bg-zinc-800 group-active:scale-90 group-active:md:scale-95"
      >
        <LoadableIcon className="w-6" Icon={Icon} selected={isSelected} />
        <span className="hidden min-w-0 2xl:block">{children}</span>
      </div>
    </Link>
  )
}
