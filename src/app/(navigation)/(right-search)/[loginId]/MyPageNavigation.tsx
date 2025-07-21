'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  loginId: string
}

export default function MyPageNavigation({ loginId }: Readonly<Props>) {
  const pathname = usePathname()

  const links = [
    { href: `/@${loginId}`, label: '게시글' },
    { href: `/@${loginId}/reply`, label: '답글' },
    { href: `/@${loginId}/bookmark`, label: '북마크' },
    { href: `/@${loginId}/censor`, label: '검열' },
  ]

  return (
    <nav className="sticky top-0 z-20 min-h-12.5 text-center border-b-2 bg-background/80 backdrop-blur overflow-x-auto scrollbar-hidden font-semibold">
      <div className="flex gap-4 px-3">
        {links.map(({ href, label }) => (
          <Link className="group relative flex-shrink-0 p-3 text-zinc-600" href={href} key={href}>
            {label}
            <span
              aria-current={pathname === href}
              className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-transparent transition group-hover:bg-zinc-600 aria-current:bg-zinc-500"
            />
          </Link>
        ))}
      </div>
    </nav>
  )
}
