'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  loginId: string
}

export default function MyPageNavigation({ loginId }: Props) {
  const pathname = usePathname()
  const links = [
    { href: `/@${loginId}`, label: '게시글' },
    { href: `/@${loginId}/reply`, label: '답글' },
    { href: `/@${loginId}/bookmark`, label: '북마크' },
  ]

  return (
    <nav
      className="sticky top-0 z-20 border-b-2 flex gap-6 mt-2 bg-background/80 backdrop-blur
        [&_a]:block [&_a]:mx-3 [&_a]:transition [&_a]:min-w-4 [&_a]:p-2.5 [&_a]:text-center [&_a]:text-zinc-600 [&_a]:border-b-4 [&_a]:border-transparent 
        [&_a]:hover:border-zinc-500 [&_a]:hover:font-bold [&_a]:hover:text-foreground [&_a]:aria-current:border-zinc-500 [&_a]:aria-current:font-bold [&_a]:aria-current:text-foreground"
    >
      {links.map(({ href, label }) => (
        <Link aria-current={pathname === href} href={href} key={href}>
          {label}
        </Link>
      ))}
    </nav>
  )
}
