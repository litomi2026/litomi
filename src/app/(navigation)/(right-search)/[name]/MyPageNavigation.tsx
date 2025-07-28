'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  name: string
}

export default function MyPageNavigation({ name }: Readonly<Props>) {
  const pathname = usePathname()

  const links = [
    { href: `/@${name}`, label: '게시글' },
    { href: `/@${name}/reply`, label: '답글' },
    { href: `/@${name}/bookmark`, label: '북마크' },
    { href: `/@${name}/censor`, label: '검열' },
    { href: `/@${name}/passkey`, label: '패스키' },
  ]

  return (
    <nav
      className="sticky top-0 z-20 min-h-12.5 border-b-2 bg-background/80 backdrop-blur font-semibold
      [&_a]:min-w-16 [&_a]:group [&_a]:relative [&_a]:flex [&_a]:justify-center [&_a]:items-center [&_a]:gap-1 [&_a]:p-3 [&_a]:transition"
    >
      <div className="relative h-full overflow-hidden">
        <div className="absolute inset-0 overflow-x-auto scrollbar-hidden">
          <div className="inline-flex gap-4 px-3 whitespace-nowrap text-zinc-600">
            {links.map(({ href, label }) => (
              <Link
                aria-current={pathname === href}
                className="aria-current:font-bold aria-current:text-foreground"
                href={href}
                key={href}
              >
                {label}
                <span
                  aria-current={pathname === href}
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-transparent transition group-hover:bg-zinc-600 aria-current:bg-zinc-500"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
