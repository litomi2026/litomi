import Link from 'next/link'
import { Ref } from 'react'

import LinkPending from '@/components/LinkPending'

type Props = {
  ariaCurrent?: boolean
  className?: string
  href: string
  index: number
  keyword: {
    label: string
    value: string
  }
  linkRef?: Ref<HTMLAnchorElement>
  onClick?: () => void
  onFocus?: () => void
  onBlur?: () => void
  textClassName?: string
}

export default function KeywordLink({
  href,
  keyword: { label, value },
  index,
  linkRef,
  ariaCurrent,
  className = '',
  textClassName = '',
  onClick,
  onFocus,
  onBlur,
}: Props) {
  return (
    <Link
      aria-current={ariaCurrent}
      className={`flex items-center justify-center gap-1 relative text-xs px-2.5 py-1 rounded-full shrink-0 transition overflow-hidden bg-zinc-800 text-zinc-400  
      hover:text-foreground hover:bg-zinc-700 ${className}`}
      href={href}
      onBlur={onBlur}
      onClick={onClick}
      onFocus={onFocus}
      prefetch={false}
      ref={linkRef}
      title={label}
    >
      <span aria-current={index < 3} className="text-xs font-bold aria-current:text-brand">
        {index + 1}
      </span>
      <span className={`truncate min-w-0 ${textClassName}`}>{label}</span>
      <LinkPending
        className="size-4"
        wrapperClassName="absolute inset-0 flex items-center justify-center animate-fade-in bg-zinc-800"
      />
    </Link>
  )
}
