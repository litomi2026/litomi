'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import LinkPending from '@/components/LinkPending'

type Props = {
  href: string
  label: string
}

export default function MyPageNavigationLink({ href, label }: Readonly<Props>) {
  const pathname = usePathname()

  return (
    <Link
      aria-current={pathname === href}
      className="aria-current:font-bold aria-current:text-foreground"
      href={href}
      key={href}
      prefetch={false}
    >
      <LinkPending className="size-6">{label}</LinkPending>
      <span
        aria-current={pathname === href}
        className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-transparent transition group-hover:bg-zinc-600 aria-current:bg-zinc-500"
      />
    </Link>
  )
}
