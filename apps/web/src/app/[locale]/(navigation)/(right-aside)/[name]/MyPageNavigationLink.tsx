'use client'

import LinkPending from '@/components/LinkPending'
import { Link, usePathname } from '@/i18n/navigation'

type Props = {
  href: string
  label: string
}

export default function MyPageNavigationLink({ href, label }: Props) {
  const pathname = usePathname()

  return (
    <Link
      aria-current={pathname === href ? 'page' : undefined}
      className="aria-[current=page]:font-bold aria-[current=page]:text-foreground"
      href={href}
      key={href}
      prefetch={false}
    >
      <LinkPending className="size-6">{label}</LinkPending>
      <span className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-transparent transition group-hover:bg-zinc-600 group-aria-[current=page]:bg-zinc-500" />
    </Link>
  )
}
