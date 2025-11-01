import Link from 'next/link'
import { Ref } from 'react'

import LinkPending from '@/components/LinkPending'

type Props = {
  keyword: string
  index: number
  onClick?: () => void
  onFocus?: () => void
  onBlur?: () => void
  ariaCurrent?: boolean
  className?: string
  textClassName?: string
  linkRef?: Ref<HTMLAnchorElement>
}

export default function KeywordLink({
  keyword,
  linkRef,
  index,
  onClick,
  onFocus,
  onBlur,
  ariaCurrent,
  className = '',
  textClassName = '',
}: Props) {
  return (
    <Link
      aria-current={ariaCurrent}
      className={`flex items-center justify-center gap-1 relative text-xs px-2.5 py-1 rounded-full shrink-0 transition overflow-hidden bg-zinc-800 text-zinc-400  
      hover:text-foreground hover:bg-zinc-700 ${className}`}
      href={`/search?${new URLSearchParams({ query: keyword })}`}
      onBlur={onBlur}
      onClick={onClick}
      onFocus={onFocus}
      prefetch={false}
      ref={linkRef}
      title={keyword}
    >
      <span aria-current={index < 3} className="text-xs font-bold aria-current:text-brand-end">
        {index + 1}
      </span>
      <span className={`truncate min-w-0 ${textClassName}`}>{keyword}</span>
      <LinkPending
        className="size-4"
        wrapperClassName="absolute inset-0 flex items-center justify-center animate-fade-in bg-zinc-800"
      />
    </Link>
  )
}
